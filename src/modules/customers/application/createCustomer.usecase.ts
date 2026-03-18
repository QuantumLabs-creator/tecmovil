// src/modules/customers/application/createCustomer.usecase.ts

import type { CustomerRepository } from "../domain/customer.repository";
import { CustomerEntity } from "../domain/customer.entity";
import { assertCreateCustomerDTO, type CreateCustomerDTO } from "./dtos/customer.dto";
import { normalizeCreateCustomer } from "../domain/customer.rules";

export class CreateCustomerUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(input: unknown) {
    assertCreateCustomerDTO(input);
    const dto = input as CreateCustomerDTO;

    const normalized = normalizeCreateCustomer(dto);

    const entity = CustomerEntity.create({
      name: normalized.name,
      email: normalized.email,
      phone: normalized.phone,
      document: normalized.document,
      customerType: normalized.customerType,
      status: normalized.status,
    });

    return this.repo.create(entity);
  }
}