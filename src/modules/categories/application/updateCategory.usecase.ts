// src/modules/categories/application/updateCategory.usecase.ts
import type { CategoryRepository } from "../domain/category.repository";
import { assertUpdateCategoryDTO, type UpdateCategoryDTO } from "./dtos/category.dto";
import { normalizeText, normalizeBoolean } from "../domain/category.rules";

export class UpdateCategoryUseCase {
  constructor(private readonly repo: CategoryRepository) {}

  async execute(id: string, input: unknown) {
    const cid = String(id ?? "").trim();
    if (!cid) throw new Error("id requerido");

    assertUpdateCategoryDTO(input);
    const dto = input as UpdateCategoryDTO;

    const patch: any = {};

    if (dto.name !== undefined) {
      const v = String(dto.name ?? "").trim();
      if (!v) throw new Error("name inválido");
      patch.name = v;
    }

    if (dto.description !== undefined) {
      patch.description = normalizeText(dto.description) ?? null;
    }

    if (dto.active !== undefined) {
      patch.active = normalizeBoolean(dto.active, true);
    }

    return this.repo.update(cid, patch);
  }
}