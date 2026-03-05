// src/modules/movements/application/searchMovements.usecase.ts

import type { MovementRepository, MovementListResult } from "../domain/movement.repository";
import type { $Enums } from "@/src/generated/prisma/client";

function parseMovementType(v?: string): $Enums.MovementType | undefined {
  const s = String(v ?? "").trim();
  if (!s) return undefined;

  const allowed: $Enums.MovementType[] = [
    "IN",
    "OUT",
    "ADJUSTMENT",
    "RETURN",
    "RESERVE",
    "RELEASE",
  ];

  if (!allowed.includes(s as $Enums.MovementType)) {
    throw new Error("type inválido");
  }

  return s as $Enums.MovementType;
}

export class SearchMovementsUseCase {
  constructor(private readonly repo: MovementRepository) {}

  async execute(params: {
    productId?: string;
    userId?: string;
    type?: string; // viene del querystring
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }): Promise<MovementListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));

    return this.repo.list({
      productId: params.productId?.trim() || undefined,
      userId: params.userId?.trim() || undefined,

      // ✅ ahora es MovementType | undefined
      type: parseMovementType(params.type),

      from: params.from?.trim() || undefined,
      to: params.to?.trim() || undefined,
      page,
      pageSize,
    });
  }
}