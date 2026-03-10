// src/modules/suppliers/application/searchSupplier.usecase.ts
import type { SupplierRepository, SupplierListParams } from "../domain/supplier.repository";

export class SearchSupplierUseCase {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(params: SupplierListParams) {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    return this.repo.list({
      q: (params.q ?? "").trim(),
      active: (params.active ?? "").trim(),
      page,
      pageSize,
    });
  }
}