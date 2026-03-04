// src/modules/categories/domain/category.rules.ts
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.repository";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

export function normalizeBoolean(v: unknown, defaultValue = true): boolean {
  if (v === undefined || v === null || toStr(v) === "") return defaultValue;
  const s = toStr(v).toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "si") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return defaultValue;
}

export function assertCreateCategoryInput(input: unknown): asserts input is CreateCategoryInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!toStr(x.name)) throw new Error("name requerido");
}

export function assertUpdateCategoryInput(input: unknown): asserts input is UpdateCategoryInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  // no obligatorio, se valida cuando venga name vacío
}

export function normalizeCreateCategory(input: CreateCategoryInput) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  const description = normalizeText(input.description);
  const active = normalizeBoolean(input.active, true);

  return { name, description, active };
}

export function normalizeUpdateCategory(dto: UpdateCategoryInput): UpdateCategoryInput {
  const out: UpdateCategoryInput = {};

  if (dto.name !== undefined) {
    const v = toStr(dto.name);
    if (!v) throw new Error("name inválido");
    out.name = v;
  }

  if (dto.description !== undefined) out.description = normalizeText(dto.description);
  if (dto.active !== undefined) out.active = normalizeBoolean(dto.active, true);

  return out;
}