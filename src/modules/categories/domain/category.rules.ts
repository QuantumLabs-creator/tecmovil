// src/modules/categories/domain/category.rules.ts
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.repository";
import {
  type CategoryStatus,
  isCategoryStatus,
} from "./category-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

export function normalizeCategoryStatus(
  v: unknown,
  defaultValue: CategoryStatus = "ACTIVE"
): CategoryStatus {
  if (v === undefined || v === null || toStr(v) === "") return defaultValue;

  const s = toStr(v).toUpperCase();

  if (isCategoryStatus(s)) return s;

  throw new Error("status inválido");
}

export function assertCreateCategoryInput(
  input: unknown
): asserts input is CreateCategoryInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");

  const x = input as Record<string, unknown>;

  if (!toStr(x.name)) throw new Error("name requerido");

  if (x.status !== undefined) {
    normalizeCategoryStatus(x.status);
  }
}

export function assertUpdateCategoryInput(
  input: unknown
): asserts input is UpdateCategoryInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");

  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !toStr(x.name)) {
    throw new Error("name inválido");
  }

  if (x.status !== undefined) {
    normalizeCategoryStatus(x.status);
  }
}

export function normalizeCreateCategory(input: CreateCategoryInput) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  const description = normalizeText(input.description);
  const status = normalizeCategoryStatus(input.status, "ACTIVE");

  return { name, description, status };
}

export function normalizeUpdateCategory(dto: UpdateCategoryInput): UpdateCategoryInput {
  const out: UpdateCategoryInput = {};

  if (dto.name !== undefined) {
    const v = toStr(dto.name);
    if (!v) throw new Error("name inválido");
    out.name = v;
  }

  if (dto.description !== undefined) {
    out.description = normalizeText(dto.description);
  }

  if (dto.status !== undefined) {
    out.status = normalizeCategoryStatus(dto.status);
  }

  return out;
}