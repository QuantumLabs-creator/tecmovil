// src/modules/units/domain/unit.repository.ts

export type UnitRecord = {
  id: string;
  name: string;
  symbol: string | null;
  active: boolean;
};

export type UnitListResult = {
  items: UnitRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type UnitListParams = {
  q?: string;
  active?: string; // "true" | "false"
  page: number;
  pageSize: number;
};

export type CreateUnitInput = {
  name: string;
  symbol?: unknown;
  active?: unknown;
};

export type UpdateUnitInput = Partial<CreateUnitInput>;

export interface UnitRepository {
  getById(id: string): Promise<UnitRecord | null>;
  getByName(name: string): Promise<UnitRecord | null>;
  list(params: UnitListParams): Promise<UnitListResult>;
  create(input: CreateUnitInput): Promise<UnitRecord>;
  update(id: string, input: UpdateUnitInput): Promise<UnitRecord>;
  delete(id: string): Promise<void>;
}