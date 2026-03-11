// src/modules/receipts/application/updateReceipt.usecase.ts

import type { ReceiptRepository } from "../domain/receipt.repository";
import {
  assertUpdateReceiptDTO,
  type UpdateReceiptDTO,
} from "./dtos/receipt.dto";

export class UpdateReceiptUseCase {
  constructor(private readonly repo: ReceiptRepository) {}

  async execute(id: string, input: unknown) {
    const rid = String(id ?? "").trim();
    if (!rid) throw new Error("id requerido");

    assertUpdateReceiptDTO(input);
    const dto = input as UpdateReceiptDTO;

    return this.repo.update(rid, {
      type: dto.type,
      autoDeleteAt: dto.autoDeleteAt ? new Date(dto.autoDeleteAt) : null,
    });
  }
}