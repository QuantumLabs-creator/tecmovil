// src/modules/units/application/searchUnit.usecase.ts
import type { UnitRepository, UnitListParams } from "../domain/unit.repository";
import { isUnitStatus } from "../domain/unit-status";

export class SearchUnitUseCase {
  constructor(private readonly repo: UnitRepository) {}

  async execute(params: UnitListParams) {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    const rawStatus = String(params.status ?? "").trim().toUpperCase();
    let status: "ACTIVE" | "INACTIVE" | undefined;

    if (rawStatus) {
      if (!isUnitStatus(rawStatus)) {
        throw new Error("status inválido");
      }
      if (rawStatus === "ARCHIVED") {
        throw new Error("No se permite buscar unidades archivadas");
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