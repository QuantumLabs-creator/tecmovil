import type { ProductRecommendationRepository } from "../domain/productRecommendation.repository";

export class DeleteProductRecommendationUseCase {
  constructor(private readonly repo: ProductRecommendationRepository) {}

  async execute(id: string) {
    const rid = String(id ?? "").trim();
    if (!rid) throw new Error("id requerido");

    await this.repo.delete(rid);
  }
}