// src/modules/customers/application/searchCustomers.usecase.ts

import type { CustomerRepository, CustomerListResult } from "../domain/customer.repository";

export class SearchCustomersUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(params: {
    q?: string;
    active?: string;
    customerType?: string;
    page: number;
    pageSize: number;
  }): Promise<CustomerListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    return this.repo.list({
      q: params.q?.trim() || undefined,
      active: params.active?.trim() || undefined,
      customerType: params.customerType?.trim() || undefined,
      page,
      pageSize,
    });
  }
}