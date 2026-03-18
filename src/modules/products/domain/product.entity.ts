// src/modules/products/domain/product.entity.ts
import { isProductStatus, ProductStatus } from "./product-status";

export class ProductEntity {
  static create(input: {
    code?: string | null;

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

    status?: ProductStatus;

    categoryId: string;
    supplierId: string | null;
    unitId: string;
  }) {
    if (!String(input.name ?? "").trim()) throw new Error("name requerido");
    if (!String(input.categoryId ?? "").trim()) throw new Error("categoryId requerido");
    if (!String(input.unitId ?? "").trim()) throw new Error("unitId requerido");

    const status = input.status ?? "ACTIVE";
    if (!isProductStatus(status)) throw new Error("status inválido");

    return {
      ...input,
      status,
    };
  }
}