// src/modules/suppliers/application/dtos/supplier.dto.ts
import { isSupplierStatus, SupplierStatus } from "../../domain/supplier-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export type SupplierDTO = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: SupplierStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplierDTO = {
  name: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: SupplierStatus;
};

export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;

export type SupplierQueryDTO = {
  q?: string;
  status?: SupplierStatus;
  page?: number;
  pageSize?: number;
};

export function assertCreateSupplierDTO(input: unknown): asserts input is CreateSupplierDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (!toStr(x.name)) throw new Error("name requerido");

  if (x.status !== undefined && !isSupplierStatus(x.status)) {
    throw new Error("status inválido");
  }
}

export function assertUpdateSupplierDTO(input: unknown): asserts input is UpdateSupplierDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !toStr(x.name)) {
    throw new Error("name inválido");
  }

  if (x.status !== undefined && !isSupplierStatus(x.status)) {
    throw new Error("status inválido");
  }
}