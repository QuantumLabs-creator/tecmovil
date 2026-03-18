// src/modules/customers/application/dtos/customer.dto.ts
import type { CustomerStatus } from "../../domain/customer-status";
import { isCustomerStatus } from "../../domain/customer-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export type CustomerDTO = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  customerType: "RETAIL" | "WHOLESALE";
  status: CustomerStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerDTO = {
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  customerType?: "RETAIL" | "WHOLESALE";
  status?: CustomerStatus;
};

export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;

export type CustomerQueryDTO = {
  q?: string;
  status?: CustomerStatus;
  customerType?: "RETAIL" | "WHOLESALE";
  page?: number;
  pageSize?: number;
};

export function assertCreateCustomerDTO(input: unknown): asserts input is CreateCustomerDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (!toStr(x.name)) throw new Error("name requerido");

  if (x.status !== undefined && !isCustomerStatus(x.status)) {
    throw new Error("status inválido");
  }
}

export function assertUpdateCustomerDTO(input: unknown): asserts input is UpdateCustomerDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !toStr(x.name)) {
    throw new Error("name inválido");
  }

  if (x.status !== undefined && !isCustomerStatus(x.status)) {
    throw new Error("status inválido");
  }
}