// src/modules/receipts/application/createReceipt.usecase.ts

import type { ReceiptRepository } from "../domain/receipt.repository";
import {
  assertCreateReceiptDTO,
  type CreateReceiptDTO,
} from "./dtos/receipt.dto";

export class CreateReceiptUseCase {
  constructor(private readonly repo: ReceiptRepository) {}

  async execute(input: unknown, uploadedById: string) {
    assertCreateReceiptDTO(input);
    const dto = input as CreateReceiptDTO;

    const uid = String(uploadedById ?? "").trim();
    if (!uid) throw new Error("uploadedById requerido");

    return this.repo.create({
      type: dto.type,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      orderId: dto.orderId ?? null,
      saleOrderId: dto.saleOrderId ?? null,
      uploadedById: uid,
      autoDeleteAt: dto.autoDeleteAt ? new Date(dto.autoDeleteAt) : null,
    });
  }
}