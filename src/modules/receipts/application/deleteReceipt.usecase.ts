// src/modules/receipts/application/deleteReceipt.usecase.ts

import type { ReceiptRepository } from "../domain/receipt.repository";
import {
  assertDeleteReceiptDTO,
  type DeleteReceiptDTO,
} from "./dtos/receipt.dto";

export class DeleteReceiptUseCase {
  constructor(private readonly repo: ReceiptRepository) {}

  async execute(id: string, input?: unknown) {
    const rid = String(id ?? "").trim();
    if (!rid) throw new Error("id requerido");

    assertDeleteReceiptDTO(input);
    const dto = (input ?? {}) as DeleteReceiptDTO;

    return this.repo.softDelete(rid, {
      reason: dto.reason ?? null,
    });
  }
}