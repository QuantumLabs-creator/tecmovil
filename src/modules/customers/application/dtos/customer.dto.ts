// src/modules/customers/application/dtos/customer.dto.ts

import type { CustomerType } from "@/src/generated/prisma/client";

export interface CustomerDTO {
  id: string;

  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;

  customerType: CustomerType; // RETAIL | WHOLESALE
  active: boolean;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateCustomerDTO {
  name: string;

  email?: string | null;
  phone?: string | null;
  document?: string | null;

  customerType?: unknown; // "RETAIL" | "WHOLESALE"
  active?: unknown;       // true|false
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {}

export interface SearchCustomersDTO {
  q?: string;
  active?: string;          // "true" | "false"
  customerType?: string;    // "RETAIL" | "WHOLESALE"
  page?: number;
  pageSize?: number;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function assertCreateCustomerDTO(input: unknown): asserts input is CreateCustomerDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;

  if (!String(x.name ?? "").trim()) throw new Error("name requerido");
}

export function assertUpdateCustomerDTO(input: unknown): asserts input is UpdateCustomerDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  // no obligatorios, pero si viene name no puede venir vacío
  const x = input as any;
  if (x.name !== undefined && !String(x.name ?? "").trim()) throw new Error("name inválido");
  if (x.email !== undefined && x.email !== null && isBlank(x.email)) throw new Error("email inválido");
}