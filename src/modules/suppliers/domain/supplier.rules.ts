// src/modules/suppliers/domain/supplier.rules.ts
import type { CreateSupplierInput, UpdateSupplierInput } from "./supplier.repository";

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

function isValidEmail(s: string) {
  // simple y suficiente para UI/API
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function normalizeEmail(v: unknown): string | null {
  const s = normalizeText(v);
  if (!s) return null;
  if (!isValidEmail(s)) throw new Error("email inválido");
  return s.toLowerCase();
}

export function assertCreateSupplierInput(input: unknown): asserts input is CreateSupplierInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!toStr(x.name)) throw new Error("name requerido");
}

export function assertUpdateSupplierInput(input: unknown): asserts input is UpdateSupplierInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
}