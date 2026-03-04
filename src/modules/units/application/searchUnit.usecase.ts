// src/modules/units/application/searchUnit.usecase.ts
import type { UnitRepository, UnitListParams } from "../domain/unit.repository";

export class SearchUnitUseCase {
  constructor(private readonly repo: UnitRepository) {}

  async execute(params: UnitListParams) {
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