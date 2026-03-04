// src/modules/categories/application/deleteCategory.usecase.ts
import type { CategoryRepository } from "../domain/category.repository";

export class DeleteCategoryUseCase {
  constructor(private readonly repo: CategoryRepository) {}

  async execute(id: string) {
    const cid = String(id ?? "").trim();
    if (!cid) throw new Error("id requerido");

    await this.repo.delete(cid);
  }
}