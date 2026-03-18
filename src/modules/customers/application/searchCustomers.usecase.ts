// src/modules/customers/application/searchCustomers.usecase.ts

import type { CustomerRepository, CustomerListResult } from "../domain/customer.repository";
import { isCustomerStatus } from "../domain/customer-status";
import { isCustomerType } from "../domain/customer-status";

export class SearchCustomersUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(params: {
    q?: string;
    status?: string;
    customerType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<CustomerListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    const rawStatus = String(params.status ?? "").trim().toUpperCase();
    let status: "ACTIVE" | "INACTIVE" | undefined;

    if (rawStatus) {
      if (!isCustomerStatus(rawStatus)) {
        throw new Error("status inválido");
      }
      if (rawStatus === "ARCHIVED") {
        throw new Error("No se permite buscar clientes archivados");
      }
      status = rawStatus;
    }

    const rawCustomerType = String(params.customerType ?? "").trim().toUpperCase();
    const customerType = rawCustomerType && isCustomerType(rawCustomerType)
      ? rawCustomerType
      : undefined;

    return this.repo.list({
      q: params.q?.trim() || undefined,
      status,
      customerType,
      page,
      pageSize,
    });
  }
}