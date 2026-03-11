// src/modules/receipts/application/getReceipt.usecase.ts

import type { ReceiptRepository } from "../domain/receipt.repository";

export class GetReceiptUseCase {
  constructor(private readonly repo: ReceiptRepository) {}

  async execute(id: string) {
    const rid = String(id ?? "").trim();
    if (!rid) throw new Error("id requerido");

    const row = await this.repo.getById(rid);
    if (!row) throw new Error("Receipt no encontrado");

    return row;
  }
}