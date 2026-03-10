// src/modules/movements/domain/movement.rules.ts

import type { MovementType } from "@/src/generated/prisma/client";

export type StockState = {
  currentStock: number;
  reservedStock: number;
};

export type ApplyMovementExtra = {
  adjustToStock?: number | null;
};

export function normalizeQuantity(v: unknown): number {
  const qty = Math.trunc(Number(v));
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("quantity inválido");
  return qty;
}

export function normalizeAdjustToStock(v: unknown): number {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n) || n < 0) throw new Error("adjustToStock inválido");
  return n;
}

export function applyMovement(
  type: MovementType,
  qty: number,
  s: StockState,
  extra?: ApplyMovementExtra
) {
  const stockBefore = s.currentStock;
  const reservedBefore = s.reservedStock;

  let stockAfter = stockBefore;
  let reservedAfter = reservedBefore;
  let finalQty = qty;

  if (reservedBefore > stockBefore) {
    throw new Error("reservedStock no puede ser mayor que currentStock");
  }

  switch (type) {
    case "IN":
    case "RETURN": {
      stockAfter = stockBefore + qty;
      break;
    }

    case "OUT": {
      if (stockBefore - qty < 0) throw new Error("Stock insuficiente");
      stockAfter = stockBefore - qty;

      if (reservedAfter > stockAfter) reservedAfter = stockAfter;
      break;
    }

    case "RESERVE": {
      if (reservedBefore + qty > stockBefore) {
        throw new Error("No hay stock disponible para reservar");
      }
      reservedAfter = reservedBefore + qty;
      break;
    }

    case "RELEASE": {
      if (reservedBefore - qty < 0) {
        throw new Error("No hay stock reservado suficiente para liberar");
      }
      reservedAfter = reservedBefore - qty;
      break;
    }

    case "ADJUSTMENT": {
      const target = normalizeAdjustToStock(extra?.adjustToStock);

      if (reservedBefore > target) {
        throw new Error("No se puede ajustar por debajo del stock reservado");
      }

      stockAfter = target;
      finalQty = Math.abs(stockAfter - stockBefore);
      break;
    }

    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }

  return {
    stockBefore,
    stockAfter,
    reservedBefore,
    reservedAfter,
    quantity: finalQty,
  };
}