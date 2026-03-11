// src/modules/receipts/domain/receipt.entity.ts

import type {
  CreateReceiptInput,
  UpdateReceiptInput,
} from "./receipt.repository";

import {
  normalizeDateOrNull,
  normalizePositiveInt,
  normalizeRequiredText,
  normalizeText,
  validateMimeType,
  validateReceiptRelation,
} from "./receipt.rules";

export class ReceiptEntity {
  static create(input: CreateReceiptInput) {
    const relation = validateReceiptRelation({
      orderId: input.orderId,
      saleOrderId: input.saleOrderId,
    });

    return {
      type: input.type,
      fileUrl: normalizeRequiredText(input.fileUrl, "fileUrl"),
      fileName: normalizeRequiredText(input.fileName, "fileName"),
      fileSize: normalizePositiveInt(input.fileSize, "fileSize"),
      mimeType: validateMimeType(
        normalizeRequiredText(input.mimeType, "mimeType")
      ),

      orderId: relation.orderId,
      saleOrderId: relation.saleOrderId,
      uploadedById: normalizeRequiredText(input.uploadedById, "uploadedById"),
      autoDeleteAt: normalizeDateOrNull(input.autoDeleteAt),
    };
  }

  static update(input: UpdateReceiptInput) {
    const out: Record<string, unknown> = {};

    if (input.type !== undefined) out.type = input.type;
    if (input.autoDeleteAt !== undefined) {
      out.autoDeleteAt = normalizeDateOrNull(input.autoDeleteAt);
    }

    return out;
  }

  static delete(reason?: string | null) {
    return {
      deleted: true,
      deletedAt: new Date(),
      deletionReason: normalizeText(reason),
    };
  }
}