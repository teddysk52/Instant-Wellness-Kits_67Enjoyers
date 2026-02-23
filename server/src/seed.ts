import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { calculateTaxLocal } from "./services/taxEngine";

const prisma = new PrismaClient();
const BULK_BATCH = 1000; // rows per createMany call

function parseTimestamp(raw?: string): Date {
  if (!raw) return new Date();
  const isoStr = raw.replace(" ", "T");
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

interface CsvRow {
  id?: string;
  latitude: string;
  longitude: string;
  subtotal: string;
  timestamp?: string;
}

async function readCsv(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        })
      )
      .on("data", (row: Record<string, string>) => {
        rows.push({
          id: row.id || undefined,
          latitude: row.latitude || "",
          longitude: row.longitude || "",
          subtotal: row.subtotal || "",
          timestamp: row.timestamp || undefined,
        });
      })
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

async function seed() {
  const t0 = Date.now();
  console.log("🌱 Starting fast seed (local geocoding, no API calls)...\n");

  // Clear existing orders for clean seed
  const existingCount = await prisma.order.count();
  if (existingCount > 0) {
    console.log(`🗑️  Clearing ${existingCount} existing orders...`);
    await prisma.order.deleteMany();
  }

  const csvPath = path.resolve(__dirname, "../../orders.csv");
  if (!fs.existsSync(csvPath)) {
    console.log("❌ orders.csv not found at", csvPath);
    return;
  }

  // 1. Read CSV
  console.log("📄 Reading CSV...");
  const rows = await readCsv(csvPath);
  console.log(`   ${rows.length} rows read in ${Date.now() - t0}ms`);

  // 2. Calculate tax for all rows in memory (instant — local geocoder)
  console.log("🧮 Calculating taxes (local geocoder)...");
  const t1 = Date.now();

  interface OrderData {
    originalId?: number;
    latitude: number;
    longitude: number;
    subtotal: number;
    compositeTaxRate: number;
    taxAmount: number;
    totalAmount: number;
    breakdown: any;
    jurisdictions: any;
    timestamp: Date;
  }

  const orders: OrderData[] = [];
  let skipped = 0;

  for (const row of rows) {
    const lat = parseFloat(row.latitude);
    const lon = parseFloat(row.longitude);
    const subtotal = parseFloat(row.subtotal);

    if (isNaN(lat) || isNaN(lon) || isNaN(subtotal)) {
      skipped++;
      continue;
    }

    const originalId = row.id ? parseInt(row.id, 10) : undefined;
    const tax = calculateTaxLocal(lat, lon, subtotal);

    orders.push({
      originalId: originalId && !isNaN(originalId) ? originalId : undefined,
      latitude: lat,
      longitude: lon,
      subtotal,
      compositeTaxRate: tax.composite_tax_rate,
      taxAmount: tax.tax_amount,
      totalAmount: tax.total_amount,
      breakdown: tax.breakdown,
      jurisdictions: tax.jurisdictions,
      timestamp: parseTimestamp(row.timestamp),
    });
  }

  console.log(`   ${orders.length} taxes calculated in ${Date.now() - t1}ms (${skipped} skipped)`);

  // 3. Bulk insert with createMany
  console.log("💾 Inserting into database...");
  const t2 = Date.now();
  let inserted = 0;

  for (let i = 0; i < orders.length; i += BULK_BATCH) {
    const batch = orders.slice(i, i + BULK_BATCH);
    const result = await prisma.order.createMany({ data: batch });
    inserted += result.count;

    const pct = ((inserted / orders.length) * 100).toFixed(0);
    process.stdout.write(`\r   ${inserted}/${orders.length} inserted (${pct}%)`);
  }

  console.log(`\n   Done in ${Date.now() - t2}ms`);

  const totalMs = Date.now() - t0;
  console.log(`\n✅ Seed complete: ${inserted} orders in ${(totalMs / 1000).toFixed(1)}s`);
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
