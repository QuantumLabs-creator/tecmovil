// src/modules/products/application/searchProducts.usecase.ts
import type { ProductRepository, ProductListResult } from "../domain/product.repository";
import { isProductStatus } from "../domain/product-status";

export class SearchProductsUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(params: {
    q?: string;
    status?: string;
    categoryId?: string;
    supplierId?: string;
    unitId?: string;
    lowStock?: boolean | string;
    page: number;
    pageSize: number;
  }): Promise<ProductListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    const lowStock =
      params.lowStock === undefined
        ? undefined
        : String(params.lowStock).toLowerCase() === "true";

    const rawStatus = String(params.status ?? "").trim().toUpperCase();
    let status: "ACTIVE" | "INACTIVE" | undefined;

    if (rawStatus) {
      if (!isProductStatus(rawStatus)) {
        throw new Error("status inválido");
      }
      if (rawStatus === "ARCHIVED") {
        throw new Error("No se permite buscar productos archivados");
      }
      status = rawStatus;
    }

    return this.repo.list({
      q: params.q?.trim() || undefined,
      status,
      categoryId: params.categoryId?.trim() || undefined,
      supplierId: params.supplierId?.trim() || undefined,
      unitId: params.unitId?.trim() || undefined,
      lowStock,
      page,
      pageSize,
    });
  }
}