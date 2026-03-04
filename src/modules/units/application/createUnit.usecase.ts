// src/modules/units/application/createUnit.usecase.ts
import type { UnitRepository } from "../domain/unit.repository";
import { UnitEntity } from "../domain/unit.entity";
import { normalizeText, normalizeBoolean } from "../domain/unit.rules";
import { assertCreateUnitDTO, type CreateUnitDTO } from "./dtos/unit.dto";

export class CreateUnitUseCase {
  constructor(private readonly repo: UnitRepository) {}

  async execute(input: unknown) {
    assertCreateUnitDTO(input);
    const dto = input as CreateUnitDTO;

    const name = String(dto.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const entity = UnitEntity.create({
      name,
      symbol: normalizeText(dto.symbol) ?? null,
      active: normalizeBoolean(dto.active, true),
    });

    return this.repo.create(entity);
  }
}