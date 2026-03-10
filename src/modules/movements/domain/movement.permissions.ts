import type { MovementType, Role } from "@/src/generated/prisma/client";

export function canCreateManualMovement(role: Role, type: MovementType) {
  if (role === "ADMIN") return true;

  if (role === "WAREHOUSE") {
    return ["IN", "OUT", "RETURN", "ADJUSTMENT"].includes(type);
  }

  return false;
}

export function isSystemMovement(type: MovementType) {
  return type === "RESERVE" || type === "RELEASE";
}