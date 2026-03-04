// src/modules/categories/application/searchCategory.usecase.ts
import type { CategoryRepository, CategoryListParams } from "../domain/category.repository";

export class SearchCategoryUseCase {
  constructor(private readonly repo: CategoryRepository) {}

  async execute(params: CategoryListParams) {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    return this.repo.list({
      q: (params.q ?? "").trim(),
      active: (params.active ?? "").trim(),
      page,
      pageSize,
    });
  }
}