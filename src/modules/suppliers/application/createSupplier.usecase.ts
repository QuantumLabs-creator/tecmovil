// src/modules/suppliers/application/createSupplier.usecase.ts
import type { SupplierRepository } from "../domain/supplier.repository";
import { SupplierEntity } from "../domain/supplier.entity";
import { normalizeText, normalizeBoolean, normalizeEmail } from "../domain/supplier.rules";
import { assertCreateSupplierDTO, type CreateSupplierDTO } from "./dtos/supplier.dto";

export class CreateSupplierUseCase {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(input: unknown) {
    assertCreateSupplierDTO(input);
    const dto = input as CreateSupplierDTO;

    const name = String(dto.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const entity = SupplierEntity.create({
      name,
      contact: normalizeText(dto.contact) ?? null,
      email: normalizeEmail(dto.email),
      phone: normalizeText(dto.phone) ?? null,
      address: normalizeText(dto.address) ?? null,
      active: normalizeBoolean(dto.active, true),
    });

    return this.repo.create(entity);
  }
}