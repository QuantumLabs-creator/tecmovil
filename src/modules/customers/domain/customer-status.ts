// src/modules/customers/domain/customer-status.ts
export const CUSTOMER_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export function isCustomerStatus(value: unknown): value is CustomerStatus {
  return typeof value === "string" &&
    CUSTOMER_STATUSES.includes(value as CustomerStatus);
}

// src/modules/customers/domain/customer-type.ts
export const CUSTOMER_TYPES = ["RETAIL", "WHOLESALE"] as const;

export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export function isCustomerType(value: unknown): value is CustomerType {
  return typeof value === "string" &&
    CUSTOMER_TYPES.includes(value as CustomerType);
}