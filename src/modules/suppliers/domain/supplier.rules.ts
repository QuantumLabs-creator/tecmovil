// src/modules/suppliers/domain/supplier.rules.ts
import type { CreateSupplierInput, UpdateSupplierInput } from "./supplier.repository";

import { isSupplierStatus, SupplierStatus } from "./supplier-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function normalizeEmail(v: unknown): string | null {
  const s = normalizeText(v);
  if (!s) return null;
  if (!isValidEmail(s)) throw new Error("email inválido");
  return s.toLowerCase();
}

export function normalizeSupplierStatus(
  v: unknown,
  defaultValue: SupplierStatus = "ACTIVE"
): SupplierStatus {
  const s = toStr(v).toUpperCase();
  if (!s) return defaultValue;
  if (isSupplierStatus(s)) return s;
  throw new Error("status inválido");
}

export function assertCreateSupplierInput(input: unknown): asserts input is CreateSupplierInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (!toStr(x.name)) throw new Error("name requerido");

  if (x.status !== undefined) normalizeSupplierStatus(x.status);
  if (x.email !== undefined) normalizeEmail(x.email);
}

export function assertUpdateSupplierInput(input: unknown): asserts input is UpdateSupplierInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !toStr(x.name)) throw new Error("name inválido");
  if (x.status !== undefined) normalizeSupplierStatus(x.status);
  if (x.email !== undefined) normalizeEmail(x.email);
}

export function normalizeCreateSupplier(input: CreateSupplierInput) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  return {
    name,
    contact: normalizeText(input.contact),
    email: normalizeEmail(input.email),
    phone: normalizeText(input.phone),
    address: normalizeText(input.address),
    status: normalizeSupplierStatus(input.status, "ACTIVE"),
  };
}

export function normalizeUpdateSupplier(input: UpdateSupplierInput) {
  const out: UpdateSupplierInput = {};

  if (input.name !== undefined) {
    const name = toStr(input.name);
    if (!name) throw new Error("name inválido");
    out.name = name;
  }

  if (input.contact !== undefined) out.contact = normalizeText(input.contact);
  if (input.email !== undefined) out.email = normalizeEmail(input.email);
  if (input.phone !== undefined) out.phone = normalizeText(input.phone);
  if (input.address !== undefined) out.address = normalizeText(input.address);
  if (input.status !== undefined) out.status = normalizeSupplierStatus(input.status);

  return out;
}