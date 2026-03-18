// src/modules/suppliers/domain/supplier.entity.ts
import { isSupplierStatus, SupplierStatus } from "./supplier-status";

export class SupplierEntity {
  static create(input: {
    name: string;
    contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status?: SupplierStatus;
  }) {
    const name = String(input.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const status = input.status ?? "ACTIVE";
    if (!isSupplierStatus(status)) throw new Error("status inválido");

    return {
      name,
      contact: input.contact ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      status,
    };
  }
}