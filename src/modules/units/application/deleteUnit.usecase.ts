// src/modules/units/application/deleteUnit.usecase.ts
import type { UnitRepository } from "../domain/unit.repository";

export class DeleteUnitUseCase {
  constructor(private readonly repo: UnitRepository) {}

  async execute(id: string) {
    const uid = String(id ?? "").trim();
    if (!uid) throw new Error("id requerido");

    await this.repo.delete(uid);
  }
}