// src/modules/products/domain/product-status.ts
export const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" &&
    PRODUCT_STATUSES.includes(value as ProductStatus);
}