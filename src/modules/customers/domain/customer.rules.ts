// src/modules/customers/domain/customer.rules.ts

import type { CustomerStatus, CustomerType } from "./customer-status";
import { isCustomerStatus, isCustomerType } from "./customer-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

export function normalizeCustomerType(
  v: unknown,
  defaultValue: CustomerType = "RETAIL"
): CustomerType {
  const s = toStr(v).toUpperCase();
  if (!s) return defaultValue;
  if (isCustomerType(s)) return s;
  throw new Error("customerType inválido");
}

export function normalizeCustomerStatus(
  v: unknown,
  defaultValue: CustomerStatus = "ACTIVE"
): CustomerStatus {
  const s = toStr(v).toUpperCase();
  if (!s) return defaultValue;
  if (isCustomerStatus(s)) return s;
  throw new Error("status inválido");
}

export function normalizeCreateCustomer(input: {
  name: unknown;
  email?: unknown;
  phone?: unknown;
  document?: unknown;
  customerType?: unknown;
  status?: unknown;
}) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  const email =
    input.email === undefined
      ? null
      : normalizeText(input.email)?.toLowerCase() ?? null;

  const phone = normalizeText(input.phone);
  const document = normalizeText(input.document);

  const customerType = normalizeCustomerType(input.customerType, "RETAIL");
  const status = normalizeCustomerStatus(input.status, "ACTIVE");

  return { name, email, phone, document, customerType, status };
}

export function normalizeUpdateCustomer(input: {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  document?: unknown;
  customerType?: unknown;
  status?: unknown;
}) {
  const out: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    document?: string | null;
    customerType?: CustomerType;
    status?: CustomerStatus;
  } = {};

  if (input.name !== undefined) {
    const name = toStr(input.name);
    if (!name) throw new Error("name inválido");
    out.name = name;
  }

  if (input.email !== undefined) {
    out.email = normalizeText(input.email)?.toLowerCase() ?? null;
  }

  if (input.phone !== undefined) {
    out.phone = normalizeText(input.phone);
  }

  if (input.document !== undefined) {
    out.document = normalizeText(input.document);
  }

  if (input.customerType !== undefined) {
    out.customerType = normalizeCustomerType(input.customerType, "RETAIL");
  }

  if (input.status !== undefined) {
    out.status = normalizeCustomerStatus(input.status, "ACTIVE");
  }

  return out;
}