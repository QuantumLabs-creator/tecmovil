// src/modules/suppliers/application/updateSupplier.usecase.ts
import type { SupplierRepository } from "../domain/supplier.repository";
import { normalizeText, normalizeBoolean, normalizeEmail } from "../domain/supplier.rules";
import { assertUpdateSupplierDTO, type UpdateSupplierDTO } from "./dtos/supplier.dto";

export class UpdateSupplierUseCase {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(id: string, input: unknown) {
    const sid = String(id ?? "").trim();
    if (!sid) throw new Error("id requerido");

    assertUpdateSupplierDTO(input);
    const dto = input as UpdateSupplierDTO;

    const patch: any = {};

    if (dto.name !== undefined) {
      const v = String(dto.name ?? "").trim();
      if (!v) throw new Error("name inválido");
      patch.name = v;
    }

    if (dto.contact !== undefined) {
      patch.contact = normalizeText(dto.contact) ?? null;
    }

    if (dto.email !== undefined) {
      patch.email = normalizeEmail(dto.email);
    }

    if (dto.phone !== undefined) {
      patch.phone = normalizeText(dto.phone) ?? null;
    }

    if (dto.address !== undefined) {
      patch.address = normalizeText(dto.address) ?? null;
    }

    if (dto.active !== undefined) {
      patch.active = normalizeBoolean(dto.active, true);
    }

    return this.repo.update(sid, patch);
  }
}