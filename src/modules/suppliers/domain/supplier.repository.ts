// src/modules/suppliers/domain/supplier.repository.ts

export type SupplierRecord = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  createdAt: Date;
};

export type SupplierListResult = {
  items: SupplierRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type SupplierListParams = {
  q?: string;
  active?: string; // "true" | "false"
  page: number;
  pageSize: number;
};

export type CreateSupplierInput = {
  name: string;
  contact?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  active?: unknown;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface SupplierRepository {
  getById(id: string): Promise<SupplierRecord | null>;
  getByName(name: string): Promise<SupplierRecord | null>;
  list(params: SupplierListParams): Promise<SupplierListResult>;
  create(input: CreateSupplierInput): Promise<SupplierRecord>;
  update(id: string, input: UpdateSupplierInput): Promise<SupplierRecord>;
  delete(id: string): Promise<void>;
}