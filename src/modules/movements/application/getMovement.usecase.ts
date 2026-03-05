// src/modules/movements/application/getMovement.usecase.ts

import type { MovementRepository, MovementRecord } from "../domain/movement.repository";

export class GetMovementUseCase {
  constructor(private readonly repo: MovementRepository) {}

  async execute(id: string): Promise<MovementRecord> {
    const mid = String(id ?? "").trim();
    if (!mid) throw new Error("id requerido");

    const m = await this.repo.getById(mid);
    if (!m) throw new Error("Movimiento no encontrado");

    return m;
  }
}