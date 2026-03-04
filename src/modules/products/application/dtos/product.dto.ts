// src/modules/products/application/dtos/product.dto.ts
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

  active: boolean;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateProductDTO {
  // opcional: si escaneas y quieres respetar el código, si no lo mandas se autogenera
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

  active?: unknown;

  categoryId: string;
  supplierId?: string | null;
  unitId: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export interface SearchProductsDTO {
  q?: string;
  active?: string;
  categoryId?: string;
  supplierId?: string;
  unitId?: string;
  lowStock?: string; // "true"
  page?: number;
  pageSize?: number;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function assertCreateProductDTO(input: unknown): asserts input is CreateProductDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;

  if (!String(x.name ?? "").trim()) throw new Error("name requerido");
  if (!String(x.categoryId ?? "").trim()) throw new Error("categoryId requerido");
  if (!String(x.unitId ?? "").trim()) throw new Error("unitId requerido");

  if (isBlank(x.purchasePrice)) throw new Error("purchasePrice requerido");
  if (isBlank(x.retailPrice)) throw new Error("retailPrice requerido");
}
