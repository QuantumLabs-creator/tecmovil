// src/modules/units/domain/unit.repository.ts
import type { UnitStatus } from "./unit-status";

export type UnitRecord = {
  id: string;
  name: string;
  symbol: string | null;
  status: UnitStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UnitListResult = {
  items: UnitRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type UnitListParams = {
  q?: string;
  status?: UnitStatus;
  page: number;
  pageSize: number;
};

export type CreateUnitInput = {
  name: string;
  symbol?: unknown;
  status?: unknown;
};

export type UpdateUnitInput = Partial<CreateUnitInput>;

export interface UnitRepository {
  getById(id: string): Promise<UnitRecord | null>;
  getByName(name: string): Promise<UnitRecord | null>;
  list(params: UnitListParams): Promise<UnitListResult>;
  create(input: CreateUnitInput): Promise<UnitRecord>;
  update(id: string, input: UpdateUnitInput): Promise<UnitRecord>;
  archive(id: string): Promise<void>;
}