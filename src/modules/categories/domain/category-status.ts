// src/modules/categories/domain/category-status.ts
export const CATEGORY_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];

export function isCategoryStatus(value: unknown): value is CategoryStatus {
  return typeof value === "string" && CATEGORY_STATUSES.includes(value as CategoryStatus);
}