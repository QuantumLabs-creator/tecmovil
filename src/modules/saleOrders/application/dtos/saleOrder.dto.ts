import type { SaleOrderStatus } from "@/src/generated/prisma/client";

export type CreateSaleOrderItemDTO = {
  productId: string;
  quantity: unknown;
};

export type CreateSaleOrderCustomerDataDTO = {
  name?: unknown;
  phone?: unknown;
  document?: unknown;
};

export type CreateSaleOrderDTO = {
  // web con usuario logueado
  userId?: string | null;

  // cliente externo / venta manual
  customerId?: string | null;

  // tipo de cliente, no pricing
  customerType?: unknown; // RETAIL | WHOLESALE

  sellerId?: string | null;
  observations?: unknown;

  customerData?: CreateSaleOrderCustomerDataDTO;

  items: CreateSaleOrderItemDTO[];
};

export type SearchSaleOrdersDTO = {
  q?: string;
  status?: string;
  mine?: string;
  customerId?: string;
  userId?: string;
  sellerId?: string;
  from?: string;
  to?: string;
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

  if (!Array.isArray(x.items) || x.items.length === 0) {
    throw new Error("items requerido");
  }

  for (const it of x.items) {
    if (!String(it?.productId ?? "").trim()) throw new Error("productId requerido");
    if (isBlank(it?.quantity)) throw new Error("quantity requerido");
  }

  if (x.customerData !== undefined && x.customerData !== null && typeof x.customerData !== "object") {
    throw new Error("customerData inválido");
  }

  if (x.customerData && typeof x.customerData === "object") {
    const cd = x.customerData as any;

    if (cd.name !== undefined && cd.name !== null && typeof cd.name !== "string") {
      throw new Error("customerData.name inválido");
    }

    if (cd.phone !== undefined && cd.phone !== null && typeof cd.phone !== "string") {
      throw new Error("customerData.phone inválido");
    }

    if (cd.document !== undefined && cd.document !== null && typeof cd.document !== "string") {
      throw new Error("customerData.document inválido");
    }
  }

  // userId o customerId puede venir vacío aquí si luego la API inyecta userId desde el token
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