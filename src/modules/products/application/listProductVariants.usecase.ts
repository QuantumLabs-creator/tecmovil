import type { ProductStatus } from "../domain/product-status";
import type { ProductRepository } from "../domain/product.repository";
import { normalizeVariantQuery } from "./dtos/product-variant.dto";

export class ListProductVariantsUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(productId: string, query?: unknown) {
    const pid = String(productId ?? "").trim();
    if (!pid) throw new Error("productId requerido");

    const q = normalizeVariantQuery(query);

    const status =
      q.status === "ACTIVE" ||
      q.status === "INACTIVE" ||
      q.status === "ARCHIVED"
        ? (q.status as ProductStatus)
        : undefined;

    return this.repo.listVariants(pid, status);
  }
}