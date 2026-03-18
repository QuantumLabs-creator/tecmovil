// src/modules/customers/application/deleteCustomer.usecase.ts

import type { CustomerRepository } from "../domain/customer.repository";

export class DeleteCustomerUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(id: string) {
    const cid = String(id ?? "").trim();
    if (!cid) throw new Error("id requerido");

    await this.repo.archive(cid);
  }
}