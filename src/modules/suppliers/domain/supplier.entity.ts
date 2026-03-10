// src/modules/suppliers/domain/supplier.entity.ts

export class SupplierEntity {
  static create(input: {
    name: string;
    contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    active: boolean;
  }) {
    if (!input.name) throw new Error("name requerido");

    return {
      name: input.name,
      contact: input.contact,
      email: input.email,
      phone: input.phone,
      address: input.address,
      active: input.active,
    };
  }
}