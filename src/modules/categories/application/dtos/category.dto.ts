// src/modules/categories/application/dtos/category.dto.ts

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export type CategoryDTO = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string; // ISO
};

export type CreateCategoryDTO = {
  name: string;
  description?: string | null;
  active?: boolean;
};

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export type CategoryQueryDTO = {
  q?: string;
  active?: string; // "true" | "false"
  page?: number;
  pageSize?: number;
};

export function assertCreateCategoryDTO(input: unknown): asserts input is CreateCategoryDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!toStr(x.name)) throw new Error("name requerido");
}

export function assertUpdateCategoryDTO(input: unknown): asserts input is UpdateCategoryDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  // no obligatorios; se valida al normalizar
}