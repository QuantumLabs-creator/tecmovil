import type { ProductRecommendationRepository } from "../domain/productRecommendation.repository";
import {
  assertCreateProductRecommendationDTO,
  type CreateProductRecommendationDTO,
} from "./dtos/productRecommendation.dto";

import {
  normalizeId,
  normalizePriority,
  assertDifferentProducts,
} from "../domain/productRecommendation.rules";

export class CreateProductRecommendationUseCase {
  constructor(private readonly repo: ProductRecommendationRepository) {}

  async execute(input: unknown) {
    assertCreateProductRecommendationDTO(input);
    const dto = input as CreateProductRecommendationDTO;

    const productId = normalizeId(dto.productId);
    const recommendedProductId = normalizeId(dto.recommendedProductId);
    const priority = normalizePriority(dto.priority);

    assertDifferentProducts(productId, recommendedProductId);

    return this.repo.create({
      productId,
      recommendedProductId,
      priority,
    });
  }
}