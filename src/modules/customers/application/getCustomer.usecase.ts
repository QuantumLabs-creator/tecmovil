// src/modules/customers/application/getCustomer.usecase.ts

import type { CustomerRepository, CustomerRecord } from "../domain/customer.repository";

export class GetCustomerUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(id: string): Promise<CustomerRecord> {
    const cid = String(id ?? "").trim();
    if (!cid) throw new Error("id requerido");

    const c = await this.repo.getById(cid);
    if (!c) throw new Error("Cliente no encontrado");

    return c;
  }
}