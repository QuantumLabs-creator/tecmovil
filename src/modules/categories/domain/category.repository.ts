// src/modules/categories/domain/category.repository.ts
import type { CategoryStatus } from "./category-status";

export type CategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  status: CategoryStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryListResult = {
  items: CategoryRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CategoryListParams = {
  q?: string;
  status?: CategoryStatus;
  page?: number;
  pageSize?: number;
};

export type CreateCategoryInput = {
  name: string;
  description?: unknown;
  status?: unknown;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CategoryRepository {
  getById(id: string): Promise<CategoryRecord | null>;
  getByName(name: string): Promise<CategoryRecord | null>;
  list(params: CategoryListParams): Promise<CategoryListResult>;
  create(input: CreateCategoryInput): Promise<CategoryRecord>;
  update(id: string, input: UpdateCategoryInput): Promise<CategoryRecord>;
  archive(id: string): Promise<void>;
}