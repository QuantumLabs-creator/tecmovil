// src/modules/units/domain/unit.rules.ts
import type { CreateUnitInput, UpdateUnitInput } from "./unit.repository";

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

export function assertCreateUnitInput(input: unknown): asserts input is CreateUnitInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!toStr(x.name)) throw new Error("name requerido");
}

export function assertUpdateUnitInput(input: unknown): asserts input is UpdateUnitInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
}

export function normalizeCreateUnit(input: CreateUnitInput) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  return {
    name,
    symbol: normalizeText(input.symbol),
    active: normalizeBoolean(input.active, true),
  };
}

export function normalizeUpdateUnit(input: UpdateUnitInput): UpdateUnitInput {
  const out: UpdateUnitInput = {};

  if (input.name !== undefined) {
    const v = toStr(input.name);
    if (!v) throw new Error("name inválido");
    out.name = v;
  }

  if (input.symbol !== undefined) {
    out.symbol = normalizeText(input.symbol);
  }

  if (input.active !== undefined) {
    out.active = normalizeBoolean(input.active, true);
  }

  return out;
}