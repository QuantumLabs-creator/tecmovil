// src/modules/units/application/dtos/unit.dto.ts
import { isUnitStatus , UnitStatus } from "../../domain/unit-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export type UnitDTO = {
  id: string;
  name: string;
  symbol: string | null;
  status: UnitStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUnitDTO = {
  name: string;
  symbol?: string | null;
  status?: UnitStatus;
};

export type UpdateUnitDTO = Partial<CreateUnitDTO>;

export type UnitQueryDTO = {
  q?: string;
  status?: UnitStatus;
  page?: number;
  pageSize?: number;
};

export function assertCreateUnitDTO(input: unknown): asserts input is CreateUnitDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (!toStr(x.name)) throw new Error("name requerido");

  if (x.status !== undefined && !isUnitStatus(x.status)) {
    throw new Error("status inválido");
  }
}

export function assertUpdateUnitDTO(input: unknown): asserts input is UpdateUnitDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !toStr(x.name)) {
    throw new Error("name inválido");
  }

  if (x.status !== undefined && !isUnitStatus(x.status)) {
    throw new Error("status inválido");
  }
}