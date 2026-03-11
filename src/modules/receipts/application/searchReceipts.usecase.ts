// src/modules/receipts/application/searchReceipts.usecase.ts

import type { ReceiptRepository } from "../domain/receipt.repository";
import {
  assertSearchReceiptsDTO,
  type SearchReceiptsDTO,
} from "./dtos/receipt.dto";

export class SearchReceiptsUseCase {
  constructor(private readonly repo: ReceiptRepository) {}

  async execute(input: unknown) {
    assertSearchReceiptsDTO(input);
    const dto = (input ?? {}) as SearchReceiptsDTO;

    const deleted =
      dto.deleted === undefined
        ? undefined
        : typeof dto.deleted === "boolean"
        ? dto.deleted
        : String(dto.deleted).trim().toLowerCase() === "true";

    return this.repo.list({
      type: dto.type,
      orderId: dto.orderId,
      saleOrderId: dto.saleOrderId,
      uploadedById: dto.uploadedById,
      deleted,
      page: Math.max(1, Number(dto.page ?? 1)),
      pageSize: Math.max(1, Number(dto.pageSize ?? 10)),
    });
  }
}