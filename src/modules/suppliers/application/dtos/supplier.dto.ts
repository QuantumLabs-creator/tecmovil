// src/modules/suppliers/application/dtos/supplier.dto.ts

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
  active: boolean;
  createdAt: string; // ISO recomendado para UI
};

export type CreateSupplierDTO = {
  name: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active?: boolean;
};

export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;

export type SupplierQueryDTO = {
  q?: string;
  active?: string; // "true" | "false"
  page?: number;
  pageSize?: number;
};

export function assertCreateSupplierDTO(input: unknown): asserts input is CreateSupplierDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!toStr(x.name)) throw new Error("name requerido");
}

export function assertUpdateSupplierDTO(input: unknown): asserts input is UpdateSupplierDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
}