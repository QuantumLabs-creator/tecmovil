// src/lib/api/sale-orders.ts

export type SaleOrderStatus =
  | "PENDING_REQUEST"
  | "APPROVED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type CustomerType = "RETAIL" | "WHOLESALE";
export type PricingType = "RETAIL" | "WHOLESALE";

export type SaleOrderUserRef = {
  id: string;
  name: string;
  email: string;
};

export type SaleOrderCustomerRef = {
  id: string;
  name: string;
  email: string | null;
};

export type SaleOrderProductRef = {
  id: string;
  code: string;
  name: string;
};

export type SaleOrderDetail = {
  id: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  productId: string;
  product: SaleOrderProductRef;
  productSnapshot?: unknown;
};

export type SaleOrder = {
  id: string;
  orderNumber: string;
  status: SaleOrderStatus;

  customerType: CustomerType;
  pricingApplied: PricingType;
  total: string;

  orderDate: string;
  deliveryDate: string | null;
  completedDate: string | null;
  observations: string | null;
  createdAt: string;

  userId: string | null;
  user: SaleOrderUserRef | null;

  customerId: string | null;
  customer: SaleOrderCustomerRef | null;

  sellerId: string | null;
  seller: SaleOrderUserRef | null;

  details: SaleOrderDetail[];
};

export type SaleOrderListResponse = {
  items: SaleOrder[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type SaleOrderListParams = {
  q?: string;
  status?: SaleOrderStatus;
  userId?: string;
  customerId?: string;
  sellerId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type CreateSaleOrderItemPayload = {
  productId: string;
  quantity: number;
};

export type CreateSaleOrderPayload = {
  userId?: string | null;
  customerId?: string | null;
  sellerId?: string | null;
  customerType?: CustomerType;
  observations?: string | null;
  items: CreateSaleOrderItemPayload[];
};

export type RejectSaleOrderPayload = {
  reason: string;
};

export type CancelSaleOrderPayload = {
  reason: string;
};

export type SetSaleOrderStatusPayload = {
  status: "PREPARING" | "READY" | "COMPLETED";
};

export type ApiError = {
  error: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw {
      error: data?.error || "Error en la operación",
      status: res.status,
    } satisfies ApiError;
  }

  return data as T;
}

function buildQuery(params?: SaleOrderListParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.userId) sp.set("userId", params.userId);
  if (params.customerId) sp.set("customerId", params.customerId);
  if (params.sellerId) sp.set("sellerId", params.sellerId);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/** =========================
 *  Lectura
 *  ========================= */

export async function getSaleOrdersApi(
  params?: SaleOrderListParams
): Promise<SaleOrderListResponse> {
  return fetchApi<SaleOrderListResponse>(`/api/sale-orders${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getMySaleOrdersApi(
  params?: Omit<SaleOrderListParams, "userId">
): Promise<SaleOrderListResponse> {
  return fetchApi<SaleOrderListResponse>(`/api/sale-orders${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getSaleOrderByIdApi(id: string): Promise<SaleOrder> {
  return fetchApi<SaleOrder>(`/api/sale-orders/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

/** =========================
 *  Escritura
 *  ========================= */

export async function createSaleOrderApi(
  payload: CreateSaleOrderPayload
): Promise<SaleOrder> {
  return fetchApi<SaleOrder>("/api/sale-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// opcional: para flujo POS si luego lo usas
export async function createSaleOrderPosApi(
  payload: CreateSaleOrderPayload
): Promise<SaleOrder> {
  return fetchApi<SaleOrder>("/api/sale-orders/pos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function approveSaleOrderApi(id: string): Promise<SaleOrder> {
  return fetchApi<SaleOrder>(`/api/sale-orders/${id}/approve`, {
    method: "POST",
  });
}

export async function rejectSaleOrderApi(
  id: string,
  payload: RejectSaleOrderPayload
): Promise<SaleOrder> {
  return fetchApi<SaleOrder>(`/api/sale-orders/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelSaleOrderApi(
  id: string,
  payload: CancelSaleOrderPayload
): Promise<SaleOrder> {
  return fetchApi<SaleOrder>(`/api/sale-orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function setSaleOrderStatusApi(
  id: string,
  payload: SetSaleOrderStatusPayload
): Promise<SaleOrder> {
  return fetchApi<SaleOrder>(`/api/sale-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}