function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export type CreateProductRecommendationDTO = {
  productId: unknown;
  recommendedProductId: unknown;
  priority?: unknown;
};

export type DeleteProductRecommendationDTO = {
  id: unknown;
};

export function assertCreateProductRecommendationDTO(
  input: unknown
): asserts input is CreateProductRecommendationDTO {
  if (!input || typeof input !== "object") {
    throw new Error("Body inválido");
  }

  const x = input as any;

  if (!toStr(x.productId)) {
    throw new Error("productId requerido");
  }

  if (!toStr(x.recommendedProductId)) {
    throw new Error("recommendedProductId requerido");
  }
}

export function assertDeleteProductRecommendationDTO(
  input: unknown
): asserts input is DeleteProductRecommendationDTO {
  if (!input || typeof input !== "object") {
    throw new Error("Body inválido");
  }

  const x = input as any;

  if (!toStr(x.id)) {
    throw new Error("id requerido");
  }
}