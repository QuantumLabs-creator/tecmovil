// src/modules/movements/domain/movement.rules.ts

import type { MovementType } from "@/src/generated/prisma/client";
import { normalizeInt } from "@/src/modules/products/domain/product.rules"; // reusa tu helper si quieres

export type StockState = { currentStock: number; reservedStock: number };

export function normalizeQuantity(v: unknown): number {
  const qty = Math.trunc(Number(v));
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("quantity inválido");
  return qty;
}

export function applyMovement(type: MovementType, qty: number, s: StockState) {
  const stockBefore = s.currentStock;
  const reservedBefore = s.reservedStock;

  let stockAfter = stockBefore;
  let reservedAfter = reservedBefore;

  if (reservedBefore > stockBefore) throw new Error("reservedStock no puede ser mayor que currentStock");

  switch (type) {
    case "IN":
    case "RETURN": {
      stockAfter = stockBefore + qty;
      break;
    }
    case "OUT": {
      if (stockBefore - qty < 0) throw new Error("Stock insuficiente");
      stockAfter = stockBefore - qty;

      // si al bajar stock el reservado queda mayor, lo ajustas
      if (reservedAfter > stockAfter) reservedAfter = stockAfter;
      break;
    }
    case "RESERVE": {
      if (reservedBefore + qty > stockBefore) throw new Error("No hay stock disponible para reservar");
      reservedAfter = reservedBefore + qty;
      break;
    }
    case "RELEASE": {
      if (reservedBefore - qty < 0) throw new Error("No hay stock reservado suficiente para liberar");
      reservedAfter = reservedBefore - qty;
      break;
    }
    case "ADJUSTMENT": {
      // Para evitar errores de negocio, no lo permitimos aún (hasta definir delta vs set).
      throw new Error("ADJUSTMENT pendiente de diseño (delta o set). Usa IN/OUT con reason por ahora.");
    }
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }

  return { stockBefore, stockAfter, reservedBefore, reservedAfter };
}