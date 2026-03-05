// src/modules/movements/domain/movement.entity.ts

import type { Prisma, $Enums } from "@/src/generated/prisma/client";

export class MovementEntity {
  static create(input: {
    type: $Enums.MovementType;
    quantity: number;

    stockBefore: number;
    stockAfter: number;

    reason: string | null;
    unitPrice: Prisma.Decimal | null;
    reference: string | null;

    productId: string;
    userId: string;
  }) {
    const type = String(input.type ?? "").trim() as $Enums.MovementType;
    if (!type) throw new Error("type requerido");

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new Error("quantity inválido");
    }

    if (!Number.isInteger(input.stockBefore) || input.stockBefore < 0) {
      throw new Error("stockBefore inválido");
    }

    if (!Number.isInteger(input.stockAfter) || input.stockAfter < 0) {
      throw new Error("stockAfter inválido");
    }

    const productId = String(input.productId ?? "").trim();
    const userId = String(input.userId ?? "").trim();

    if (!productId) throw new Error("productId requerido");
    if (!userId) throw new Error("userId requerido");

    const reason =
      input.reason === undefined || input.reason === null
        ? null
        : String(input.reason).trim() || null;

    const reference =
      input.reference === undefined || input.reference === null
        ? null
        : String(input.reference).trim() || null;

    return {
      ...input,
      type,
      quantity: Math.trunc(input.quantity),
      stockBefore: Math.trunc(input.stockBefore),
      stockAfter: Math.trunc(input.stockAfter),
      reason,
      reference,
      productId,
      userId,
    };
  }
}