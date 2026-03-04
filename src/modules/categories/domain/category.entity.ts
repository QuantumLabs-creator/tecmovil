// src/modules/categories/domain/category.entity.ts
export class CategoryEntity {
  static create(input: {
    name: string;
    description: string | null;
    active: boolean;
  }) {
    const name = String(input.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    return {
      name,
      description: input.description,
      active: input.active,
    };
  }
}