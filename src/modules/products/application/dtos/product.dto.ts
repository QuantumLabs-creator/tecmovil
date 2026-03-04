// src/modules/products/application/dtos/product.dto.ts

export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;

  purchasePrice: string; // mejor serializar Decimal a string
  salePrice: string;

  minStock: number;
  currentStock: number;

  active: boolean;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDTO {

  name: string;
  description?: string | null;

  purchasePrice: unknown;
  salePrice: unknown;

  minStock?: unknown;
  currentStock?: unknown;

  minSalePrice?: unknown;
  maxSalePrice?: unknown;

  active?: unknown;

  categoryId: string;
  supplierId?: string | null;
  unitId: string;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string | null;

  purchasePrice?: unknown;
  salePrice?: unknown;

  minStock?: unknown;
  currentStock?: unknown;

  minSalePrice?: unknown;
  maxSalePrice?: unknown;

  active?: unknown;

  categoryId?: string;
  supplierId?: string | null;
  unitId?: string;
}

export interface SearchProductsDTO {
  q?: string;
  active?: string;      // "true" | "false"
  categoryId?: string;
  supplierId?: string;
  unitId?: string;
  lowStock?: string;    // "true"
  page?: number;
  pageSize?: number;
}

export function assertCreateProductDTO(input: unknown): asserts input is CreateProductDTO {
  if (!input || typeof input !== "object") {
    throw new Error("Body inválido");
  }

  const x = input as any;

  if (!String(x.name ?? "").trim()) {
    throw new Error("name requerido");
  }

  if (!String(x.categoryId ?? "").trim()) {
    throw new Error("categoryId requerido");
  }

  if (!String(x.unitId ?? "").trim()) {
    throw new Error("unitId requerido");
  }

  if (x.purchasePrice === undefined || String(x.purchasePrice).trim() === "") {
    throw new Error("purchasePrice requerido");
  }

  if (x.salePrice === undefined || String(x.salePrice).trim() === "") {
    throw new Error("salePrice requerido");
  }
}
