import { CategoryStatus, isCategoryStatus } from "./category-status";

// src/modules/categories/domain/category.entity.ts
export class CategoryEntity {
  static create(input: {
    name: string;
    description: string | null;
    status?: CategoryStatus;
  }) {
    const name = String(input.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const status: CategoryStatus = input.status ?? "ACTIVE";

    if (!isCategoryStatus(status)) {
      throw new Error("status inválido");
    }

    return {
      name,
      description: input.description ?? null,
      status,
    };
  }
}