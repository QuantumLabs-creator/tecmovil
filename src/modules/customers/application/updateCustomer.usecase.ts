// src/modules/customers/application/updateCustomer.usecase.ts

import type { CustomerRepository, CustomerRecord } from "../domain/customer.repository";
import { normalizeUpdateCustomer } from "../domain/customer.rules";
import { assertUpdateCustomerDTO, type UpdateCustomerDTO } from "./dtos/customer.dto";

export class UpdateCustomerUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(id: string, dto: unknown): Promise<CustomerRecord> {
    const cid = String(id ?? "").trim();
    if (!cid) throw new Error("id requerido");

    assertUpdateCustomerDTO(dto);
    const input = normalizeUpdateCustomer(dto);

    return this.repo.update(cid, input);
  }
}