// src/modules/units/application/getUnit.usecase.ts
import type { UnitRepository } from "../domain/unit.repository";

export class GetUnitUseCase {
  constructor(private readonly repo: UnitRepository) {}

  async execute(id: string) {
    const uid = String(id ?? "").trim();
    if (!uid) throw new Error("id requerido");

    const row = await this.repo.getById(uid);
    if (!row) throw new Error("Unidad no encontrada");

    return row;
  }
}