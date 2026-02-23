import { parse } from "csv-parse";
import { Readable } from "stream";

export interface CsvRow {
  id?: string;
  latitude: string;
  longitude: string;
  subtotal: string;
  timestamp?: string;
}

export function parseCsv(buffer: Buffer): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];
    const stream = Readable.from(buffer);

    stream
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
      .on("error", (err: Error) => reject(err));
  });
}
