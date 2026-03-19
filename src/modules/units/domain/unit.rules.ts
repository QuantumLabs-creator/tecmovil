// src/modules/units/domain/unit.rules.ts
import type { CreateUnitInput, UpdateUnitInput } from "./unit.repository";
import { isUnitStatus, UnitStatus } from "./unit-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

export function normalizeUnitStatus(
  v: unknown,
  defaultValue: UnitStatus = "ACTIVE"
): UnitStatus {
  const s = toStr(v).toUpperCase();
  if (!s) return defaultValue;
  if (isUnitStatus(s)) return s;
  throw new Error("status inválido");
}

export function assertCreateUnitInput(input: unknown): asserts input is CreateUnitInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (!toStr(x.name)) throw new Error("name requerido");

  if (x.status !== undefined) {
    normalizeUnitStatus(x.status);
  }
}

export function assertUpdateUnitInput(input: unknown): asserts input is UpdateUnitInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !toStr(x.name)) {
    throw new Error("name inválido");
  }

  if (x.status !== undefined) {
    normalizeUnitStatus(x.status);
  }
}

export function normalizeCreateUnit(input: CreateUnitInput) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  return {
    name,
    symbol: normalizeText(input.symbol),
    status: normalizeUnitStatus(input.status, "ACTIVE"),
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

  if (input.status !== undefined) {
    out.status = normalizeUnitStatus(input.status);
  }

  return out;
}