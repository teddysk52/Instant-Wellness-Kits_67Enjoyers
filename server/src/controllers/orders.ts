import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { calculateTax, calculateTaxLocal } from "../services/taxEngine";
import { parseCsv } from "../utils/csvParser";
import {
  createOrderSchema,
  listOrdersSchema as getOrdersSchema,
} from "../utils/validation";

const prisma = new PrismaClient();

/* ---------- helpers ---------- */

function parseTimestamp(raw?: string): Date {
  if (!raw) return new Date();
  // format: "2025-11-04 10:17:04.915257248"
  const isoStr = raw.replace(" ", "T");
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ---------- GET /orders ---------- */

export async function getOrders(req: Request, res: Response) {
  try {
    const query = getOrdersSchema.parse(req.query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (query.search) {
      const num = parseFloat(query.search);
      if (!isNaN(num)) {
        where.originalId = num;
      }
    }

    if (query.subtotalMin !== undefined || query.subtotalMax !== undefined) {
      where.subtotal = {};
      if (query.subtotalMin !== undefined) where.subtotal.gte = query.subtotalMin;
      if (query.subtotalMax !== undefined) where.subtotal.lte = query.subtotalMax;
    }

    if (query.taxRateMin !== undefined || query.taxRateMax !== undefined) {
      where.compositeTaxRate = {};
      if (query.taxRateMin !== undefined) where.compositeTaxRate.gte = query.taxRateMin;
      if (query.taxRateMax !== undefined) where.compositeTaxRate.lte = query.taxRateMax;
    }

    if (query.dateFrom || query.dateTo) {
      where.timestamp = {};
      if (query.dateFrom) where.timestamp.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setDate(end.getDate() + 1);
        where.timestamp.lt = end;
      }
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput = {
      [query.sortBy ?? "timestamp"]: query.sortOrder ?? "desc",
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, orderBy, skip, take: limit }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("getOrders error:", err?.message ?? String(err));
    res.status(400).json({ error: err.message ?? "Bad request" });
  }
}

/* ---------- GET /orders/stats ---------- */

export async function getStats(_req: Request, res: Response) {
  try {
    const agg = await prisma.order.aggregate({
      _count: { id: true },
      _sum: { subtotal: true, taxAmount: true, totalAmount: true },
      _avg: { compositeTaxRate: true, subtotal: true },
      _min: { subtotal: true, totalAmount: true, compositeTaxRate: true },
      _max: { subtotal: true, totalAmount: true, compositeTaxRate: true },
    });

    // top jurisdictions by order count
    const topJurisdictions = await prisma.$queryRaw`
      SELECT
        jurisdictions->>'county' as county,
        COUNT(*)::int as order_count,
        SUM(tax_amount)::float as total_tax,
        AVG(composite_tax_rate)::float as avg_rate
      FROM orders
      WHERE jurisdictions->>'county' IS NOT NULL
      GROUP BY jurisdictions->>'county'
      ORDER BY order_count DESC
      LIMIT 10
    `;

    // orders by subtotal bucket
    const subtotalDistribution = await prisma.$queryRaw`
      SELECT
        CASE
          WHEN subtotal < 25 THEN '0-25'
          WHEN subtotal < 50 THEN '25-50'
          WHEN subtotal < 100 THEN '50-100'
          WHEN subtotal < 150 THEN '100-150'
          ELSE '150+'
        END as bucket,
        COUNT(*)::int as count,
        SUM(tax_amount)::float as total_tax
      FROM orders
      GROUP BY bucket
      ORDER BY bucket
    `;

    res.json({
      summary: {
        totalOrders: agg._count.id,
        totalSubtotal: agg._sum.subtotal,
        totalTax: agg._sum.taxAmount,
        totalRevenue: agg._sum.totalAmount,
        avgSubtotal: agg._avg.subtotal,
        avgTaxRate: agg._avg.compositeTaxRate,
        minTaxRate: agg._min.compositeTaxRate,
        maxTaxRate: agg._max.compositeTaxRate,
      },
      topJurisdictions,
      subtotalDistribution,
    });
  } catch (err: any) {
    console.error("getStats error:", err?.message ?? String(err));
    res.status(500).json({ error: err.message ?? "Internal error" });
  }
}

/* ---------- GET /orders/:id ---------- */

export async function getOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Internal error" });
  }
}

/* ---------- POST /orders ---------- */

export async function createOrder(req: Request, res: Response) {
  try {
    const data = createOrderSchema.parse(req.body);
    const tax = await calculateTax(data.latitude, data.longitude, data.subtotal);

    const order = await prisma.order.create({
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        subtotal: data.subtotal,
        compositeTaxRate: tax.composite_tax_rate,
        taxAmount: tax.tax_amount,
        totalAmount: tax.total_amount,
        breakdown: tax.breakdown as any,
        jurisdictions: tax.jurisdictions as any,
        timestamp: data.timestamp ? parseTimestamp(data.timestamp) : new Date(),
      },
    });

    res.status(201).json(order);
  } catch (err: any) {
    console.error("createOrder error:", err?.message ?? String(err));
    res.status(400).json({ error: err.message ?? "Bad request" });
  }
}

/* ---------- POST /orders/import ---------- */

const BULK_BATCH = 1000;

export async function importOrders(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const rows = await parseCsv(req.file.buffer);
    if (rows.length === 0) {
      return res.status(400).json({ error: "CSV file is empty" });
    }

    // Compute all taxes in memory (instant — local geocoder)
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
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const lat = parseFloat(row.latitude);
      const lon = parseFloat(row.longitude);
      const subtotal = parseFloat(row.subtotal);

      if (isNaN(lat) || isNaN(lon) || isNaN(subtotal)) {
        failed++;
        errors.push({
          row: rowNum,
          error: `Invalid data: lat=${row.latitude}, lon=${row.longitude}, subtotal=${row.subtotal}`,
        });
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

    // Bulk insert with createMany
    let processed = 0;
    for (let i = 0; i < orders.length; i += BULK_BATCH) {
      const batch = orders.slice(i, i + BULK_BATCH);
      const result = await prisma.order.createMany({ data: batch });
      processed += result.count;
      console.log(`Import progress: ${processed}/${orders.length}`);
    }

    res.json({
      message: `Import complete: ${processed} processed, ${failed} failed out of ${rows.length} rows`,
      processed,
      failed,
      total: rows.length,
      errors: errors.slice(0, 50),
    });
  } catch (err: any) {
    console.error("importOrders error:", err?.message ?? String(err));
    res.status(500).json({ error: err.message ?? "Import failed" });
  }
}

/* ---------- DELETE /orders/:id ---------- */

export async function deleteOrder(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    await prisma.order.delete({ where: { id } });
    res.status(204).end();
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(500).json({ error: err.message ?? "Internal error" });
  }
}

/* ---------- DELETE /orders ---------- */

export async function deleteAllOrders(_req: Request, res: Response) {
  try {
    const result = await prisma.order.deleteMany();
    res.json({ deleted: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Internal error" });
  }
}
