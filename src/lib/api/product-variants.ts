export type ProductVariant = {
  id: string;
  productId: string;

  color: string | null;
  size: string | null;

  sku: string | null;
  retailPrice: string | null;

  currentStock: number;
  reservedStock: number;

  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  archivedAt: string | null;

  createdAt: string;
  updatedAt: string;
};

export type ProductVariantListParams = {
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
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
      error: data?.error || data?.message || "Error en la operación",
      status: res.status,
    } satisfies ApiError;
  }

  return data as T;
}

function buildQuery(params?: ProductVariantListParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.status) sp.set("status", params.status);

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getProductVariantsApi(
  productId: string,
  params?: ProductVariantListParams
): Promise<ProductVariant[]> {
  return fetchApi<ProductVariant[]>(
    `/api/products/${productId}/variants${buildQuery(params)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function createProductVariantApi(
  productId: string,
  payload: unknown
): Promise<ProductVariant> {
  return fetchApi<ProductVariant>(`/api/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductVariantApi(
  variantId: string,
  payload: unknown
): Promise<ProductVariant> {
  return fetchApi<ProductVariant>(`/api/products/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductVariantApi(
  variantId: string
): Promise<{ ok: true }> {
  return fetchApi<{ ok: true }>(`/api/products/variants/${variantId}`, {
    method: "DELETE",
  });
}