// src/modules/categories/application/getCategory.usecase.ts
import type { CategoryRepository } from "../domain/category.repository";

export class GetCategoryUseCase {
  constructor(private readonly repo: CategoryRepository) { }

  async execute(id: string) {
    const cid = String(id ?? "").trim();
    if (!cid) throw new Error("id requerido");

    const row = await this.repo.getById(cid);
    if (!row || row.status === "ARCHIVED") {
      throw new Error("Categoría no encontrada");
    }

    return row;
  }
}