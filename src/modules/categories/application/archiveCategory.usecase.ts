// src/modules/categories/application/archiveCategory.usecase.ts
import type { CategoryRepository } from "../domain/category.repository";

export class ArchiveCategoryUseCase {
  constructor(private readonly repo: CategoryRepository) {}

  async execute(id: string) {
    const cid = String(id ?? "").trim();
    if (!cid) throw new Error("id requerido");

    await this.repo.archive(cid);
  }
}