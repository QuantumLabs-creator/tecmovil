// src/modules/categories/application/searchCategory.usecase.ts
import type { CategoryRepository, CategoryListParams } from "../domain/category.repository";
import { isCategoryStatus } from "../domain/category-status";

export class SearchCategoryUseCase {
  constructor(private readonly repo: CategoryRepository) {}

  async execute(params: CategoryListParams) {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    const rawStatus = String(params.status ?? "").trim().toUpperCase();

    let status: CategoryListParams["status"] | undefined;

    if (rawStatus) {
      if (!isCategoryStatus(rawStatus)) {
        throw new Error("status inválido");
      }

      if (rawStatus === "ARCHIVED") {
        throw new Error("No se permite buscar categorías archivadas");
      }

      status = rawStatus; // solo ACTIVE o INACTIVE
    }

    return this.repo.list({
      q: String(params.q ?? "").trim(),
      status,
      page,
      pageSize,
    });
  }
}