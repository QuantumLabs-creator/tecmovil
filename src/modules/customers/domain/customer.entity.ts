// src/modules/customers/domain/customer.entity.ts

import type { CustomerStatus, CustomerType } from "./customer-status";
import { isCustomerStatus, isCustomerType } from "./customer-status";

export class CustomerEntity {
  static create(input: {
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;
    customerType?: CustomerType;
    status?: CustomerStatus;
  }) {
    const name = String(input.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const customerType = input.customerType ?? "RETAIL";
    if (!isCustomerType(customerType)) {
      throw new Error("customerType inválido");
    }

    const status = input.status ?? "ACTIVE";
    if (!isCustomerStatus(status)) {
      throw new Error("status inválido");
    }

    return {
      name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      document: input.document ?? null,
      customerType,
      status,
    };
  }
}