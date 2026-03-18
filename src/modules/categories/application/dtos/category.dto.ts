// src/modules/categories/application/dtos/category.dto.ts

import { CategoryStatus, isCategoryStatus } from "../../domain/category-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export type CategoryDTO = {
  id: string;
  name: string;
  description: string | null;
  status: CategoryStatus;
  archivedAt: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type CreateCategoryDTO = {
  name: string;
  description?: string | null;
  status?: CategoryStatus;
};

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export type CategoryQueryDTO = {
  q?: string;
  status?: CategoryStatus;
  page?: number;
  pageSize?: number;
};

export function assertCreateCategoryDTO(input: unknown): asserts input is CreateCategoryDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");

  const x = input as Record<string, unknown>;

  if (!toStr(x.name)) throw new Error("name requerido");

  if (x.status !== undefined && !isCategoryStatus(x.status)) {
    throw new Error("status inválido");
  }
}

export function assertUpdateCategoryDTO(input: unknown): asserts input is UpdateCategoryDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");

  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !toStr(x.name)) {
    throw new Error("name inválido");
  }

  if (x.status !== undefined && !isCategoryStatus(x.status)) {
    throw new Error("status inválido");
  }
}