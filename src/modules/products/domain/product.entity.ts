// src/modules/products/domain/product.entity.ts
import type { Prisma } from "@/src/generated/prisma/client";

export class ProductEntity {
  static create(input: {

    name: string;
    description: string | null;

    purchasePrice: Prisma.Decimal;
    salePrice: Prisma.Decimal;

    minStock: number;
    currentStock: number;

    minSalePrice: Prisma.Decimal | null;
    maxSalePrice: Prisma.Decimal | null;

    active: boolean;

    categoryId: string;
    supplierId: string | null;
    unitId: string;
  }) {
    return {

      name: input.name,
      description: input.description,

      purchasePrice: input.purchasePrice,
      salePrice: input.salePrice,

      minStock: input.minStock,
      currentStock: input.currentStock,

      minSalePrice: input.minSalePrice,
      maxSalePrice: input.maxSalePrice,

      active: input.active,

      categoryId: input.categoryId,
      supplierId: input.supplierId,
      unitId: input.unitId,
    };
  }
}
