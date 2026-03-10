export type UnitApiRecord = {
  id: string;
  name: string;
  symbol: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UnitListData = {
  items: UnitApiRecord[];
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

export type SearchUnitsParams = {
  q?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateUnitPayload = {
  name: string;
  symbol?: string | null;
  active?: boolean;
};

export type UpdateUnitPayload = {
  name?: string;
  symbol?: string | null;
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

function buildQuery(params?: SearchUnitsParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (params.active !== undefined) sp.set("active", String(params.active));
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getUnitsApi(
  params?: SearchUnitsParams
): Promise<ApiEnvelope<UnitListData>> {
  return fetchApi<UnitListData>(`/api/units${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getUnitByIdApi(
  id: string
): Promise<ApiEnvelope<UnitApiRecord>> {
  return fetchApi<UnitApiRecord>(`/api/units/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function createUnitApi(
  payload: CreateUnitPayload
): Promise<ApiEnvelope<UnitApiRecord>> {
  return fetchApi<UnitApiRecord>("/api/units", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUnitApi(
  id: string,
  payload: UpdateUnitPayload
): Promise<ApiEnvelope<UnitApiRecord>> {
  return fetchApi<UnitApiRecord>(`/api/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateUnitApi(
  id: string
): Promise<ApiEnvelope<{ deleted?: boolean } | UnitApiRecord>> {
  return fetchApi<{ deleted?: boolean } | UnitApiRecord>(`/api/units/${id}`, {
    method: "DELETE",
  });
}