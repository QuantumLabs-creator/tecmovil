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
  quantity: unknown;

  reason?: string | null;
  unitPrice?: unknown;
  reference?: string | null;
}

export interface SearchMovementsDTO {
  productId?: string;
  userId?: string;
  type?: string;
  from?: string; // ISO
  to?: string;   // ISO
  page?: number;
  pageSize?: number;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function assertCreateMovementDTO(input: unknown): asserts input is CreateMovementDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;

  if (!String(x.productId ?? "").trim()) throw new Error("productId requerido");
  if (!String(x.type ?? "").trim()) throw new Error("type requerido");
  if (isBlank(x.quantity)) throw new Error("quantity requerido");

  const allowed = ["IN", "OUT", "RETURN", "RESERVE", "RELEASE", "ADJUSTMENT"];
  if (!allowed.includes(String(x.type))) throw new Error("type inválido");
}