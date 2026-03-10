export type SupplierApiRecord = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type SupplierListData = {
  items: SupplierApiRecord[];
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

export type SearchSuppliersParams = {
  q?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateSupplierPayload = {
  name: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active?: boolean;
};

export type UpdateSupplierPayload = {
  name?: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active?: boolean;
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
      error: data?.error || "Error en la operación",
      status: res.status,
    } satisfies ApiError;
  }

  return data as ApiEnvelope<T>;
}

function buildQuery(params?: SearchSuppliersParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (params.active !== undefined) sp.set("active", String(params.active));
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getSuppliersApi(
  params?: SearchSuppliersParams
): Promise<ApiEnvelope<SupplierListData>> {
  return fetchApi<SupplierListData>(`/api/suppliers${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getSupplierByIdApi(
  id: string
): Promise<ApiEnvelope<SupplierApiRecord>> {
  return fetchApi<SupplierApiRecord>(`/api/suppliers/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function createSupplierApi(
  payload: CreateSupplierPayload
): Promise<ApiEnvelope<SupplierApiRecord>> {
  return fetchApi<SupplierApiRecord>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSupplierApi(
  id: string,
  payload: UpdateSupplierPayload
): Promise<ApiEnvelope<SupplierApiRecord>> {
  return fetchApi<SupplierApiRecord>(`/api/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateSupplierApi(
  id: string
): Promise<ApiEnvelope<{ deleted?: boolean } | SupplierApiRecord>> {
  return fetchApi<{ deleted?: boolean } | SupplierApiRecord>(`/api/suppliers/${id}`, {
    method: "DELETE",
  });
}