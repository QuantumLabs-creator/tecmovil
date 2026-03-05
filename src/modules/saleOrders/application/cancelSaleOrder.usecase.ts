import type { SaleOrderRepository } from "../domain/saleOrder.repository";
import { assertCancelSaleOrderDTO } from "./dtos/saleOrder.dto";

export class CancelSaleOrderUseCase {
  constructor(private readonly repo: SaleOrderRepository) {}

  async execute(id: string, actorId: string, body: unknown) {
    const oid = String(id ?? "").trim();
    if (!oid) throw new Error("id requerido");

    assertCancelSaleOrderDTO(body);
    const reason = String((body as any).reason).trim();

    return this.repo.cancel(oid, actorId, reason);
  }
}