// src/modules/products/domain/product.repository.ts

import type { Prisma } from "@/src/generated/prisma/client";

export type ProductRecord = {
  id: string;
  code: string;

  name: string;
  description: string | null;
  image: string | null;

  purchasePrice: Prisma.Decimal;
  retailPrice: Prisma.Decimal;
  wholesalePrice: Prisma.Decimal | null;
  wholesaleMinQuantity: number;

  minSalePrice: Prisma.Decimal | null;
  maxSalePrice: Prisma.Decimal | null;

  minStock: number;
  currentStock: number;
  reservedStock: number;

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
  active?: string;
  categoryId?: string;
  supplierId?: string;
  unitId?: string;
  lowStock?: boolean;
  page: number;
  pageSize: number;
};

export type CreateProductInput = {
  code?: string | null;

  name: string;
  description?: string | null;
  image?: string | null;

  purchasePrice: unknown;
  retailPrice: unknown;

  wholesalePrice?: unknown;
  wholesaleMinQuantity?: unknown;

  minSalePrice?: unknown;
  maxSalePrice?: unknown;

  minStock?: unknown;
  currentStock?: unknown;
  reservedStock?: unknown;

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
  create(input: any): Promise<ProductRecord>;
  update(id: string, input: any): Promise<ProductRecord>;
  delete(id: string): Promise<void>;
}
