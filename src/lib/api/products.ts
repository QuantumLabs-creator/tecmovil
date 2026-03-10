// src/lib/api/products.ts

export type Product = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  image: string | null;

  purchasePrice: string;
  retailPrice: string;
  wholesalePrice: string | null;
  wholesaleMinQuantity: number;

  minSalePrice: string | null;
  maxSalePrice: string | null;

  minStock: number;
  currentStock: number;
  reservedStock: number;

  active: boolean;
  createdAt: string;
  updatedAt: string;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  category: { id: string; name: string };
  supplier: { id: string; name: string } | null;
  unit: { id: string; name: string; symbol: string | null };
};

export type ProductListResponse = {
  items: Product[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ProductListParams = {
  q?: string;
  active?: boolean;
  categoryId?: string;
  supplierId?: string;
  unitId?: string;
  lowStock?: boolean;
  page?: number;
  pageSize?: number;
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

function buildQuery(params?: ProductListParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (params.active !== undefined) sp.set("active", String(params.active));
  if (params.categoryId) sp.set("categoryId", params.categoryId);
  if (params.supplierId) sp.set("supplierId", params.supplierId);
  if (params.unitId) sp.set("unitId", params.unitId);
  if (params.lowStock !== undefined) sp.set("lowStock", String(params.lowStock));
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getProductsApi(
  params?: ProductListParams
): Promise<ProductListResponse> {
  return fetchApi<ProductListResponse>(`/api/products${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getProductByIdApi(id: string): Promise<Product> {
  return fetchApi<Product>(`/api/products/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}