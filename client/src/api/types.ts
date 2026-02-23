export interface Order {
  id: string;
  originalId: number | null;
  latitude: number;
  longitude: number;
  subtotal: number;
  compositeTaxRate: number;
  taxAmount: number;
  totalAmount: number;
  breakdown: {
    stateRate: number;
    countyRate: number;
    cityRate: number;
    specialRates: { name: string; rate: number }[];
  };
  jurisdictions: {
    state: string;
    county: string;
    city: string;
  };
  timestamp: string;
  createdAt: string;
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  subtotalMin?: number;
  subtotalMax?: number;
  taxRateMin?: number;
  taxRateMax?: number;
}

export interface CreateOrderPayload {
  latitude: number;
  longitude: number;
  subtotal: number;
  timestamp?: string;
}

export interface ImportResult {
  message: string;
  processed: number;
  failed: number;
  total: number;
  errors: { row: number; error: string }[];
}

export interface StatsData {
  summary: {
    totalOrders: number;
    totalSubtotal: number | null;
    totalTax: number | null;
    totalRevenue: number | null;
    avgSubtotal: number | null;
    avgTaxRate: number | null;
    minTaxRate: number | null;
    maxTaxRate: number | null;
  };
  topJurisdictions: {
    county: string;
    order_count: number;
    total_tax: number;
    avg_rate: number;
  }[];
  subtotalDistribution: {
    bucket: string;
    count: number;
    total_tax: number;
  }[];
}
