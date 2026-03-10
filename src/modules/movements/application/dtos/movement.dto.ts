// src/modules/movements/application/dtos/movement.dto.ts

export type MovementTypeDTO =
  | "IN"
  | "OUT"
  | "RETURN"
  | "RESERVE"
  | "RELEASE"
  | "ADJUSTMENT";

export interface MovementDTO {
  id: string;
  type: MovementTypeDTO;
  quantity: number;

  stockBefore: number;
  stockAfter: number;

  reason: string | null;
  unitPrice: string | null;
  reference: string | null;

  productId: string;
  userId: string;

  createdAt: string; // ISO
}

export interface CreateMovementDTO {
  productId: string;
  type: MovementTypeDTO;

  // Para IN / OUT / RETURN / RESERVE / RELEASE
  quantity?: unknown;

  // Para ADJUSTMENT
  adjustToStock?: unknown;

  reason?: string | null;
  unitPrice?: unknown;
  reference?: string | null;
}

export interface SearchMovementsDTO {
  productId?: string;
  userId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function assertCreateMovementDTO(input: unknown): asserts input is CreateMovementDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");

  const x = input as Record<string, unknown>;

  const productId = String(x.productId ?? "").trim();
  const type = String(x.type ?? "").trim() as MovementTypeDTO;
  const allowed: MovementTypeDTO[] = ["IN", "OUT", "RETURN", "RESERVE", "RELEASE", "ADJUSTMENT"];

  if (!productId) throw new Error("productId requerido");
  if (!type) throw new Error("type requerido");
  if (!allowed.includes(type)) throw new Error("type inválido");

  if (type === "ADJUSTMENT") {
    if (isBlank(x.adjustToStock)) {
      throw new Error("adjustToStock requerido para ADJUSTMENT");
    }

    const target = Math.trunc(Number(x.adjustToStock));
    if (!Number.isFinite(target) || target < 0) {
      throw new Error("adjustToStock inválido");
    }

    if (isBlank(x.reason)) {
      throw new Error("reason requerido para ADJUSTMENT");
    }

    return;
  }

  if (isBlank(x.quantity)) throw new Error("quantity requerido");

  const qty = Math.trunc(Number(x.quantity));
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("quantity inválido");
  }
}