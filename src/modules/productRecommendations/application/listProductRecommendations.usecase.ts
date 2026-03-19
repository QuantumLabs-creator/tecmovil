import type { ProductRecommendationRepository } from "../domain/productRecommendation.repository";

export class ListProductRecommendationsUseCase {
  constructor(private readonly repo: ProductRecommendationRepository) {}

  async execute(productId: string) {
    const pid = String(productId ?? "").trim();
    if (!pid) throw new Error("productId requerido");

    return this.repo.listByProduct(pid);
  }
}