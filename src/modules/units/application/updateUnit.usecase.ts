// src/modules/units/application/updateUnit.usecase.ts
import type { UnitRepository } from "../domain/unit.repository";
import { normalizeText, normalizeBoolean } from "../domain/unit.rules";
import { assertUpdateUnitDTO, type UpdateUnitDTO } from "./dtos/unit.dto";

export class UpdateUnitUseCase {
  constructor(private readonly repo: UnitRepository) {}

  async execute(id: string, input: unknown) {
    const uid = String(id ?? "").trim();
    if (!uid) throw new Error("id requerido");

    assertUpdateUnitDTO(input);
    const dto = input as UpdateUnitDTO;

    const patch: any = {};

    if (dto.name !== undefined) {
      const v = String(dto.name ?? "").trim();
      if (!v) throw new Error("name inválido");
      patch.name = v;
    }

    if (dto.symbol !== undefined) {
      patch.symbol = normalizeText(dto.symbol) ?? null;
    }

    if (dto.active !== undefined) {
      patch.active = normalizeBoolean(dto.active, true);
    }

    return this.repo.update(uid, patch);
  }
}