// src/modules/receipts/domain/receipt.repository.ts

import type { $Enums } from "@/src/generated/prisma/client";

export type ReceiptRecord = {
  id: string;
  type: $Enums.ReceiptType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;

  deleted: boolean;
  deletedAt: Date | null;
  deletionReason: string | null;
  autoDeleteAt: Date | null;

  orderId: string | null;
  saleOrderId: string | null;
  uploadedById: string;

  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type ReceiptListParams = {
  type?: $Enums.ReceiptType;
  orderId?: string;
  saleOrderId?: string;
  uploadedById?: string;
  deleted?: boolean;
  page: number;
  pageSize: number;
};

export type ReceiptListResult = {
  items: ReceiptRecord[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type CreateReceiptInput = {
  type: $Enums.ReceiptType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;

  orderId?: string | null;
  saleOrderId?: string | null;
  uploadedById: string;

  autoDeleteAt?: Date | null;
};

export type UpdateReceiptInput = {
  type?: $Enums.ReceiptType;
  autoDeleteAt?: Date | null;
};

export type DeleteReceiptInput = {
  reason?: string | null;
};

export interface ReceiptRepository {
  getById(id: string): Promise<ReceiptRecord | null>;
  list(params: ReceiptListParams): Promise<ReceiptListResult>;
  create(input: CreateReceiptInput): Promise<ReceiptRecord>;
  update(id: string, input: UpdateReceiptInput): Promise<ReceiptRecord>;
  softDelete(id: string, input?: DeleteReceiptInput): Promise<ReceiptRecord>;
}