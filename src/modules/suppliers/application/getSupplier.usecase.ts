// src/modules/suppliers/application/getSupplier.usecase.ts
import type { SupplierRepository } from "../domain/supplier.repository";

export class GetSupplierUseCase {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(id: string) {
    const sid = String(id ?? "").trim();
    if (!sid) throw new Error("id requerido");

    const row = await this.repo.getById(sid);
    if (!row) throw new Error("Proveedor no encontrado");

    return row;
  }
}