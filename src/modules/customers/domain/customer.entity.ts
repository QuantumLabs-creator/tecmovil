// src/modules/customers/domain/customer.entity.ts

import type { CustomerType } from "@/src/generated/prisma/client";

export class CustomerEntity {
  static create(input: {
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;

    customerType: CustomerType;
    active: boolean;
  }) {
    if (!String(input.name ?? "").trim()) throw new Error("name requerido");
    return { ...input };
  }
}