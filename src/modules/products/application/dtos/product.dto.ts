// src/modules/products/application/dtos/product.dto.ts

import { isProductStatus, ProductStatus } from "../../domain/product-status";


export interface ProductDTO {
  id: string;
  code: string;

  name: string;
  description: string | null;
  image: string | null;

  purchasePrice: string;
  retailPrice: string;
  wholesalePrice: string | null;
  wholesaleMinQuantity: number;

  minSalePrice: string | null;
  maxSalePrice: string | null;

  minStock: number;
  currentStock: number;
  reservedStock: number;

  status: ProductStatus;
  archivedAt: string | null;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDTO {
  code?: string;

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

  status?: ProductStatus;

  categoryId: string;
  supplierId?: string | null;
  unitId: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export interface SearchProductsDTO {
  q?: string;
  status?: string; // solo ACTIVE / INACTIVE en search
  categoryId?: string;
  supplierId?: string;
  unitId?: string;
  lowStock?: string;
  page?: number;
  pageSize?: number;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function assertCreateProductDTO(input: unknown): asserts input is CreateProductDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (!String(x.name ?? "").trim()) throw new Error("name requerido");
  if (!String(x.categoryId ?? "").trim()) throw new Error("categoryId requerido");
  if (!String(x.unitId ?? "").trim()) throw new Error("unitId requerido");

  if (isBlank(x.purchasePrice)) throw new Error("purchasePrice requerido");
  if (isBlank(x.retailPrice)) throw new Error("retailPrice requerido");

  if (x.status !== undefined && !isProductStatus(x.status)) {
    throw new Error("status inválido");
  }
}

export function assertUpdateProductDTO(input: unknown): asserts input is UpdateProductDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  if (x.name !== undefined && !String(x.name ?? "").trim()) {
    throw new Error("name inválido");
  }

  if (x.status !== undefined && !isProductStatus(x.status)) {
    throw new Error("status inválido");
  }
}