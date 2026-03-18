// src/modules/suppliers/application/searchSupplier.usecase.ts
import type { SupplierRepository, SupplierListParams } from "../domain/supplier.repository";
import { isSupplierStatus } from "../domain/supplier-status";

export class SearchSupplierUseCase {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(params: SupplierListParams) {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    const rawStatus = String(params.status ?? "").trim().toUpperCase();
    let status: "ACTIVE" | "INACTIVE" | undefined;

    if (rawStatus) {
      if (!isSupplierStatus(rawStatus)) {
        throw new Error("status inválido");
      }
      if (rawStatus === "ARCHIVED") {
        throw new Error("No se permite buscar proveedores archivados");
      }
      status = rawStatus;
    }

    return this.repo.list({
      q: String(params.q ?? "").trim(),
      status,
      page,
      pageSize,
    });
  }
}