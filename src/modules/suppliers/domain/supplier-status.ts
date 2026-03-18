// src/modules/suppliers/domain/supplier-status.ts
export const SUPPLIER_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export function isSupplierStatus(value: unknown): value is SupplierStatus {
  return typeof value === "string" &&
    SUPPLIER_STATUSES.includes(value as SupplierStatus);
}