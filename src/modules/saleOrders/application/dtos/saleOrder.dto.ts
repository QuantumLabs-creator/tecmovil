import type { CustomerType, SaleOrderStatus } from "@/src/generated/prisma/client";

export type CreateSaleOrderItemDTO = {
  productId: string;
  quantity: unknown;
};

export type CreateSaleOrderDTO = {
  // si viene de web con usuario logueado, normalmente NO mandas userId (lo sacas del token)
  userId?: string | null;

  // cliente externo
  customerId?: string | null;

  // si no tienes customerId y es externo, puedes crearlo antes con módulo customers
  customerType?: unknown; // RETAIL | WHOLESALE (tipo del cliente, NO el pricing por ítem)

  sellerId?: string | null; // opcional si el pedido lo crea seller

  observations?: unknown;

  items: CreateSaleOrderItemDTO[];
};

export type SearchSaleOrdersDTO = {
  q?: string;
  status?: string;
  mine?: string; // "true" => filtra por userId del token
  customerId?: string;
  userId?: string;
  sellerId?: string;

  from?: string; // ISO date
  to?: string;   // ISO date

  page?: number;
  pageSize?: number;
};

export type RejectSaleOrderDTO = { reason: unknown };
export type CancelSaleOrderDTO = { reason: unknown };

export type SetSaleOrderStatusDTO = {
  status: unknown; // PREPARING | READY | COMPLETED
};

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function assertCreateSaleOrderDTO(input: unknown): asserts input is CreateSaleOrderDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;

  if (!Array.isArray(x.items) || x.items.length === 0) throw new Error("items requerido");

  for (const it of x.items) {
    if (!String(it?.productId ?? "").trim()) throw new Error("productId requerido");
    if (isBlank(it?.quantity)) throw new Error("quantity requerido");
  }

  // Debe tener userId o customerId (externo) o al menos customerType; en tu caso:
  // - web: userId lo sacas del token (puede venir null aquí)
  // - tienda: customerId (externo)
  // lo validamos suave: al menos uno de los dos o que luego lo completes en capa API
  if (!String(x.userId ?? "").trim() && !String(x.customerId ?? "").trim()) {
    // permitimos si tu API luego inyecta userId del token
  }
}

export function assertRejectSaleOrderDTO(input: unknown): asserts input is RejectSaleOrderDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!String(x.reason ?? "").trim()) throw new Error("reason requerido");
}

export function assertCancelSaleOrderDTO(input: unknown): asserts input is CancelSaleOrderDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  if (!String(x.reason ?? "").trim()) throw new Error("reason requerido");
}

export function assertSetSaleOrderStatusDTO(input: unknown): asserts input is SetSaleOrderStatusDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;
  const s = String(x.status ?? "").trim().toUpperCase();
  if (!["PREPARING", "READY", "COMPLETED"].includes(s)) throw new Error("status inválido");
}