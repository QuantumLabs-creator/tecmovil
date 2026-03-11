// src/modules/receipts/application/dtos/receipt.dto.ts

import type { $Enums } from "@/src/generated/prisma/client";

export interface SearchReceiptsDTO {
  type?: $Enums.ReceiptType;
  orderId?: string;
  saleOrderId?: string;
  uploadedById?: string;
  deleted?: boolean | string;
  page?: number;
  pageSize?: number;
}

export interface CreateReceiptDTO {
  type: $Enums.ReceiptType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;

  orderId?: string | null;
  saleOrderId?: string | null;
  uploadedById?: string;
  autoDeleteAt?: string | null;
}

export interface UpdateReceiptDTO {
  type?: $Enums.ReceiptType;
  autoDeleteAt?: string | null;
}

export interface DeleteReceiptDTO {
  reason?: string | null;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function assertSearchReceiptsDTO(
  input: unknown
): asserts input is SearchReceiptsDTO {
  if (!input || typeof input !== "object") return;

  const x = input as Record<string, unknown>;

  if (!isBlank(x.page)) {
    const page = Number(x.page);
    if (!Number.isFinite(page) || page < 1) throw new Error("page inválido");
  }

  if (!isBlank(x.pageSize)) {
    const pageSize = Number(x.pageSize);
    if (!Number.isFinite(pageSize) || pageSize < 1) throw new Error("pageSize inválido");
  }
}

export function assertCreateReceiptDTO(
  input: unknown
): asserts input is CreateReceiptDTO {
  if (!input || typeof input !== "object") {
    throw new Error("Body inválido");
  }

  const x = input as Record<string, unknown>;

  if (!String(x.type ?? "").trim()) throw new Error("type requerido");
  if (!String(x.fileUrl ?? "").trim()) throw new Error("fileUrl requerido");
  if (!String(x.fileName ?? "").trim()) throw new Error("fileName requerido");

  const fileSize = Number(x.fileSize);
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new Error("fileSize inválido");
  }

  if (!String(x.mimeType ?? "").trim()) throw new Error("mimeType requerido");

  const hasOrderId = !!String(x.orderId ?? "").trim();
  const hasSaleOrderId = !!String(x.saleOrderId ?? "").trim();

  if (Number(hasOrderId) + Number(hasSaleOrderId) !== 1) {
    throw new Error("Debes enviar exactamente uno entre orderId o saleOrderId");
  }
}

export function assertUpdateReceiptDTO(
  input: unknown
): asserts input is UpdateReceiptDTO {
  if (!input || typeof input !== "object") {
    throw new Error("Body inválido");
  }
}

export function assertDeleteReceiptDTO(
  input: unknown
): asserts input is DeleteReceiptDTO {
  if (input === undefined || input === null) return;
  if (typeof input !== "object") throw new Error("Body inválido");
}