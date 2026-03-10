// src/modules/movements/application/createMovement.usecase.ts

import type { Role, MovementType } from "@/src/generated/prisma/client";
import type { MovementRepository } from "../domain/movement.repository";
import { assertCreateMovementDTO, type CreateMovementDTO } from "./dtos/movement.dto";

function canCreateManualMovement(role: Role, type: MovementType) {
  if (role === "ADMIN") return true;

  if (role === "WAREHOUSE") {
    return type === "IN" || type === "OUT" || type === "RETURN" || type === "ADJUSTMENT";
  }

  return false;
}

export class CreateMovementUseCase {
  constructor(private readonly repo: MovementRepository) {}

  async execute(input: unknown, userId: string, role: Role) {
    assertCreateMovementDTO(input);
    const dto = input as CreateMovementDTO;

    const uid = String(userId ?? "").trim();
    if (!uid) throw new Error("userId requerido");

    const type = dto.type as MovementType;

    // movimientos internos del sistema
    if (type === "RESERVE" || type === "RELEASE") {
      throw new Error("Este tipo de movimiento no se puede registrar manualmente");
    }

    if (!canCreateManualMovement(role, type)) {
      throw new Error("No tienes permisos para registrar este movimiento");
    }

    const quantity =
      type === "ADJUSTMENT"
        ? 0
        : Math.trunc(Number(dto.quantity));

    const adjustToStock =
      type === "ADJUSTMENT"
        ? Math.trunc(Number(dto.adjustToStock))
        : null;

    return this.repo.create({
      productId: String(dto.productId).trim(),
      type,
      quantity,
      reason: dto.reason ?? null,
      unitPrice: dto.unitPrice,
      reference: dto.reference ?? null,
      userId: uid,
      adjustToStock,
    });
  }
}