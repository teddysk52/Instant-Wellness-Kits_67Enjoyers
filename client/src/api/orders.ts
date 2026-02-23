import type {
  OrdersResponse,
  CreateOrderPayload,
  Order,
  OrderFilters,
  ImportResult,
  StatsData,
} from "./types";

const API_BASE = "/orders";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchOrders(
  filters: OrderFilters = {}
): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.search) params.set("search", filters.search);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.subtotalMin !== undefined)
    params.set("subtotalMin", String(filters.subtotalMin));
  if (filters.subtotalMax !== undefined)
    params.set("subtotalMax", String(filters.subtotalMax));
  if (filters.taxRateMin !== undefined)
    params.set("taxRateMin", String(filters.taxRateMin));
  if (filters.taxRateMax !== undefined)
    params.set("taxRateMax", String(filters.taxRateMax));

  const qs = params.toString();
  return request<OrdersResponse>(`${API_BASE}${qs ? `?${qs}` : ""}`);
}

export async function fetchOrder(id: string): Promise<Order> {
  return request<Order>(`${API_BASE}/${id}`);
}

export async function fetchStats(): Promise<StatsData> {
  return request<StatsData>(`${API_BASE}/stats`);
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<Order> {
  return request<Order>(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function importOrdersCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  return request<ImportResult>(`${API_BASE}/import`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteAllOrders(): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(API_BASE, { method: "DELETE" });
}
