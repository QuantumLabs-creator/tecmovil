export type ReceiptType =
  | "INVOICE"
  | "PAYMENT_PROOF"
  | "DELIVERY_PROOF"
  | "OTHER";

export type ReceiptUploadedBy = {
  id: string;
  name: string;
  email: string;
};

export type Receipt = {
  id: string;
  type: ReceiptType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;

  deleted: boolean;
  deletedAt: string | null;
  deletionReason: string | null;
  autoDeleteAt: string | null;

  orderId: string | null;
  saleOrderId: string | null;
  uploadedById: string;

  uploadedBy?: ReceiptUploadedBy;
};

export type ReceiptListResponse = {
  items: Receipt[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type SearchReceiptsParams = {
  type?: ReceiptType;
  orderId?: string;
  saleOrderId?: string;
  uploadedById?: string;
  deleted?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateReceiptPayload = {
  type: ReceiptType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;

  orderId?: string | null;
  saleOrderId?: string | null;
  autoDeleteAt?: string | null;
};

export type UpdateReceiptPayload = {
  type?: ReceiptType;
  autoDeleteAt?: string | null;
};

export type DeleteReceiptPayload = {
  reason?: string | null;
};

export type ApiError = {
  error: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<ApiEnvelope<T>> {
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
      error: data?.error || data?.message || "Error en la operación",
      status: res.status,
    } satisfies ApiError;
  }

  return data as ApiEnvelope<T>;
}

function buildQuery(params?: SearchReceiptsParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.type) sp.set("type", params.type);
  if (params.orderId) sp.set("orderId", params.orderId);
  if (params.saleOrderId) sp.set("saleOrderId", params.saleOrderId);
  if (params.uploadedById) sp.set("uploadedById", params.uploadedById);
  if (params.deleted !== undefined) sp.set("deleted", String(params.deleted));
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/** =========================
 *  Lectura
 *  ========================= */

export async function getReceiptsApi(
  params?: SearchReceiptsParams
): Promise<ApiEnvelope<ReceiptListResponse>> {
  return fetchApi<ReceiptListResponse>(`/api/receipts${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getReceiptByIdApi(
  id: string
): Promise<ApiEnvelope<Receipt>> {
  return fetchApi<Receipt>(`/api/receipts/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

/** =========================
 *  Escritura
 *  ========================= */

export async function createReceiptApi(
  payload: CreateReceiptPayload
): Promise<ApiEnvelope<Receipt>> {
  return fetchApi<Receipt>("/api/receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateReceiptApi(
  id: string,
  payload: UpdateReceiptPayload
): Promise<ApiEnvelope<Receipt>> {
  return fetchApi<Receipt>(`/api/receipts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteReceiptApi(
  id: string,
  payload?: DeleteReceiptPayload
): Promise<ApiEnvelope<Receipt>> {
  return fetchApi<Receipt>(`/api/receipts/${id}`, {
    method: "DELETE",
    body: JSON.stringify(payload ?? {}),
  });
}