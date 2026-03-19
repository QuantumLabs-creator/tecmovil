export type ProductRecommendation = {
  id: string;
  productId: string;
  recommendedProductId: string;
  priority: number;
  createdAt: string;
  recommendedProduct: {
    id: string;
    code: string;
    name: string;
    image: string | null;
    retailPrice: string;
    currentStock: number;
    reservedStock: number;
    status: string;
  };
};

export type CreateProductRecommendationPayload = {
  productId: string;
  recommendedProductId: string;
  priority?: number;
};

export type ProductRecommendationsResponse = {
  ok: boolean;
  data: ProductRecommendation[];
};

export type ProductRecommendationResponse = {
  ok: boolean;
  data: ProductRecommendation;
};

export type OkResponse = {
  ok: boolean;
};

export type ApiError = {
  error: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function fetchApi<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
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

export async function getProductRecommendationsApi(
  productId: string
): Promise<ProductRecommendationsResponse> {
  return fetchApi<ProductRecommendationsResponse>(
    `/api/products/${productId}/recommendations`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
}

export async function createProductRecommendationApi(
  payload: CreateProductRecommendationPayload
): Promise<ProductRecommendationResponse> {
  return fetchApi<ProductRecommendationResponse>(
    `/api/products/${payload.productId}/recommendations`,
    {
      method: "POST",
      body: JSON.stringify({
        recommendedProductId: payload.recommendedProductId,
        priority: payload.priority ?? 0,
      }),
    }
  );
}

export async function deleteProductRecommendationApi(
  id: string
): Promise<OkResponse> {
  return fetchApi<OkResponse>(`/api/product-recommendations/${id}`, {
    method: "DELETE",
  });
}