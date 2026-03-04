// src/modules/products/domain/product.entity.ts

import type { Prisma } from "@/src/generated/prisma/client";

export class ProductEntity {
  static create(input: {
    code?: string | null;

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

    categoryId: string;
    supplierId: string | null;
    unitId: string;
  }) {
    if (!String(input.name ?? "").trim()) throw new Error("name requerido");
    if (!String(input.categoryId ?? "").trim()) throw new Error("categoryId requerido");
    if (!String(input.unitId ?? "").trim()) throw new Error("unitId requerido");

    return { ...input };
  }
}
