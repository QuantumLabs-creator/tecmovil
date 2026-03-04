// src/modules/units/domain/unit.entity.ts

export class UnitEntity {
  static create(input: {
    name: string;
    symbol: string | null;
    active: boolean;
  }) {
    if (!input.name) throw new Error("name requerido");

    return {
      name: input.name,
      symbol: input.symbol,
      active: input.active,
    };
  }
}