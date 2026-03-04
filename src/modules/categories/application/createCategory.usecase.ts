// src/modules/categories/application/createCategory.usecase.ts
import type { CategoryRepository } from "../domain/category.repository";
import { CategoryEntity } from "../domain/category.entity";
import { assertCreateCategoryDTO, type CreateCategoryDTO } from "./dtos/category.dto";
import { normalizeText, normalizeBoolean } from "../domain/category.rules";

export class CreateCategoryUseCase {
  constructor(private readonly repo: CategoryRepository) {}

  async execute(input: unknown) {
    assertCreateCategoryDTO(input);
    const dto = input as CreateCategoryDTO;

    const name = String(dto.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const entity = CategoryEntity.create({
      name,
      description: normalizeText(dto.description) ?? null,
      active: normalizeBoolean(dto.active, true),
    });

    return this.repo.create(entity);
  }
}