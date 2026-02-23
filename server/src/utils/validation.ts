import { z } from "zod";

export const createOrderSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  subtotal: z.number().positive(),
  timestamp: z.string().optional(),
});

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["timestamp", "subtotal", "totalAmount", "compositeTaxRate", "createdAt"]).default("timestamp"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  subtotalMin: z.coerce.number().optional(),
  subtotalMax: z.coerce.number().optional(),
  taxRateMin: z.coerce.number().optional(),
  taxRateMax: z.coerce.number().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
