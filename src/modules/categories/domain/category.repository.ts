// src/modules/categories/domain/category.repository.ts

export type CategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
};

export type CategoryListResult = {
  items: CategoryRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CategoryListParams = {
  q?: string;
  active?: string; // "true" | "false"
  page?: number;
  pageSize?: number;
};

export type CreateCategoryInput = {
  name: string;
  description?: unknown;
  active?: unknown;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CategoryRepository {
  getById(id: string): Promise<CategoryRecord | null>;
  getByName(name: string): Promise<CategoryRecord | null>;
  list(params: CategoryListParams): Promise<CategoryListResult>;
  create(input: CreateCategoryInput): Promise<CategoryRecord>;
  update(id: string, input: UpdateCategoryInput): Promise<CategoryRecord>;
  delete(id: string): Promise<void>;
}