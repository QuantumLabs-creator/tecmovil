// src/modules/units/domain/unit-status.ts
export const UNIT_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export type UnitStatus = (typeof UNIT_STATUSES)[number];

export function isUnitStatus(value: unknown): value is UnitStatus {
  return typeof value === "string" &&
    UNIT_STATUSES.includes(value as UnitStatus);
}