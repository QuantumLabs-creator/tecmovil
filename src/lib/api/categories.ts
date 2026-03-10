export type CategoryApiRecord = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type CategoryListData = {
  items: CategoryApiRecord[];
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

export type SearchCategoriesParams = {
  q?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateCategoryPayload = {
  name: string;
  description?: string | null;
  active?: boolean;
};

export type UpdateCategoryPayload = {
  name?: string;
  description?: string | null;
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

function buildQuery(params?: SearchCategoriesParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (params.active !== undefined) sp.set("active", String(params.active));
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getCategoriesApi(
  params?: SearchCategoriesParams
): Promise<ApiEnvelope<CategoryListData>> {
  return fetchApi<CategoryListData>(`/api/categories${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getCategoryByIdApi(
  id: string
): Promise<ApiEnvelope<CategoryApiRecord>> {
  return fetchApi<CategoryApiRecord>(`/api/categories/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function createCategoryApi(
  payload: CreateCategoryPayload
): Promise<ApiEnvelope<CategoryApiRecord>> {
  return fetchApi<CategoryApiRecord>("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategoryApi(
  id: string,
  payload: UpdateCategoryPayload
): Promise<ApiEnvelope<CategoryApiRecord>> {
  return fetchApi<CategoryApiRecord>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateCategoryApi(
  id: string
): Promise<ApiEnvelope<{ success?: boolean } | CategoryApiRecord>> {
  return fetchApi<{ success?: boolean } | CategoryApiRecord>(`/api/categories/${id}`, {
    method: "DELETE",
  });
}