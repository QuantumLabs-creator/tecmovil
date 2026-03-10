// src/modules/suppliers/application/deleteSupplier.usecase.ts
import type { SupplierRepository } from "../domain/supplier.repository";

export class DeleteSupplierUseCase {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(id: string) {
    const sid = String(id ?? "").trim();
    if (!sid) throw new Error("id requerido");

    await this.repo.delete(sid);
  }
}