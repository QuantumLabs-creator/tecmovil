// src/modules/units/domain/unit.entity.ts
import { isUnitStatus, UnitStatus } from "./unit-status";

export class UnitEntity {
  static create(input: {
    name: string;
    symbol: string | null;
    status?: UnitStatus;
  }) {
    const name = String(input.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const status = input.status ?? "ACTIVE";
    if (!isUnitStatus(status)) throw new Error("status inválido");

    return {
      name,
      symbol: input.symbol ?? null,
      status,
    };
  }
}