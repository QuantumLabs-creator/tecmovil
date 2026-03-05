// src/modules/products/application/searchProducts.usecase.ts
import type { ProductRepository, ProductListResult } from "../domain/product.repository";

export class SearchProductsUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(params: {
    q?: string;
    active?: string;      // true|false
    categoryId?: string;
    supplierId?: string;
    unitId?: string;
    lowStock?: boolean;    // true|false
    page: number;
    pageSize: number;
  }): Promise<ProductListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    const lowStock =
      params.lowStock === undefined
        ? undefined
        : String(params.lowStock).toLowerCase() === "true";

    return this.repo.list({
      q: params.q?.trim() || undefined,
      active: params.active?.trim() || undefined,
      categoryId: params.categoryId?.trim() || undefined,
      supplierId: params.supplierId?.trim() || undefined,
      unitId: params.unitId?.trim() || undefined,
      lowStock,
      page,
      pageSize,
    });
  }
}
