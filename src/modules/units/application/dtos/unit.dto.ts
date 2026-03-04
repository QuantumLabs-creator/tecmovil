// src/modules/units/application/dtos/unit.dto.ts

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export type UnitDTO = {
  id: string;
  name: string;
  symbol: string | null;
  active: boolean;
};

export type CreateUnitDTO = {
  name: string;
  symbol?: string | null;
  active?: boolean;
};

export type UpdateUnitDTO = Partial<CreateUnitDTO>;

export type UnitQueryDTO = {
  q?: string;
  active?: string; // "true" | "false"
  page?: number;
  pageSize?: number;
};

export function assertCreateUnitDTO(input: unknown): asserts input is CreateUnitDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!toStr(x.name)) throw new Error("name requerido");
}

export function assertUpdateUnitDTO(input: unknown): asserts input is UpdateUnitDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
}