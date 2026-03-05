// src/modules/customers/domain/customer.rules.ts

import type { CustomerType } from "@/src/generated/prisma/client";

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

export function normalizeCustomerType(v: unknown, defaultValue: CustomerType = "RETAIL"): CustomerType {
  const s = toStr(v).toUpperCase();
  if (!s) return defaultValue;
  if (s === "RETAIL" || s === "WHOLESALE") return s as CustomerType;
  return defaultValue;
}

export function normalizeCreateCustomer(input: any) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  // email opcional, pero si viene => normalizado y lower
  const emailRaw = input.email;
  const email = emailRaw === undefined ? null : normalizeText(emailRaw)?.toLowerCase() ?? null;

  const phone = normalizeText(input.phone);
  const document = normalizeText(input.document);

  const customerType = normalizeCustomerType(input.customerType, "RETAIL");
  const active = normalizeBoolean(input.active, true);

  return { name, email, phone, document, customerType, active };
}

export function normalizeUpdateCustomer(input: any) {
  const out: any = {};

  if (input.name !== undefined) {
    const name = toStr(input.name);
    if (!name) throw new Error("name inválido");
    out.name = name;
  }

  if (input.email !== undefined) {
    out.email = normalizeText(input.email)?.toLowerCase() ?? null;
  }
  if (input.phone !== undefined) out.phone = normalizeText(input.phone);
  if (input.document !== undefined) out.document = normalizeText(input.document);

  if (input.customerType !== undefined) out.customerType = normalizeCustomerType(input.customerType, "RETAIL");
  if (input.active !== undefined) out.active = normalizeBoolean(input.active, true);

  return out;
}