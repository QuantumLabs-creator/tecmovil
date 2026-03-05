// src/modules/movements/application/createMovement.usecase.ts

import type { MovementRepository } from "../domain/movement.repository";
import { assertCreateMovementDTO, type CreateMovementDTO } from "./dtos/movement.dto";

export class CreateMovementUseCase {
  constructor(private readonly repo: MovementRepository) {}

  async execute(input: unknown, userId: string) {
    assertCreateMovementDTO(input);
    const dto = input as CreateMovementDTO;

    const uid = String(userId ?? "").trim();
    if (!uid) throw new Error("userId requerido");

    return this.repo.create({
      productId: String(dto.productId).trim(),
      type: dto.type as any,
      quantity: Math.trunc(Number(dto.quantity)),
      reason: dto.reason ?? null,
      unitPrice: dto.unitPrice,
      reference: dto.reference ?? null,
      userId: uid,
    });
  }
}