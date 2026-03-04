// src/modules/products/domain/product.repository.ts
import type { Prisma } from "@/src/generated/prisma/client";

export type ProductRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;

  purchasePrice: Prisma.Decimal;
  salePrice: Prisma.Decimal;

  minStock: number;
  currentStock: number;

  minSalePrice: Prisma.Decimal | null;
  maxSalePrice: Prisma.Decimal | null;

  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  category: { id: string; name: string };
  supplier: { id: string; name: string } | null;
  unit: { id: string; name: string; symbol: string | null };
};

export type ProductListResult = {
  items: ProductRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type ProductListParams = {
  q?: string;
  active?: string; // "true" | "false"
  categoryId?: string;
  supplierId?: string;
  unitId?: string;
  lowStock?: boolean; // currentStock <= minStock
  page: number;
  pageSize: number;
};

export type CreateProductInput = {
  name: string;
  description?: string | null;

  purchasePrice: unknown; // number|string|Decimal (lo normalizas en rules)
  salePrice: unknown;

  minStock?: unknown;
  currentStock?: unknown;

  minSalePrice?: unknown; // opcional
  maxSalePrice?: unknown;

  active?: unknown;

  categoryId: string;
  supplierId?: string | null;
  unitId: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductRepository {
  getById(id: string): Promise<ProductRecord | null>;
  getByCode(code: string): Promise<ProductRecord | null>;
  list(params: ProductListParams): Promise<ProductListResult>;
  create(input: CreateProductInput): Promise<ProductRecord>;
  update(id: string, input: UpdateProductInput): Promise<ProductRecord>;
  delete(id: string): Promise<void>;
}
