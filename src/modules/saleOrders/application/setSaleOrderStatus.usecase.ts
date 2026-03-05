import type { SaleOrderRepository } from "../domain/saleOrder.repository";
import { assertSetSaleOrderStatusDTO } from "./dtos/saleOrder.dto";

export class SetSaleOrderStatusUseCase {
  constructor(private readonly repo: SaleOrderRepository) {}

  async execute(id: string, actorId: string, body: unknown) {
    const oid = String(id ?? "").trim();
    if (!oid) throw new Error("id requerido");

    assertSetSaleOrderStatusDTO(body);
    const status = String((body as any).status).trim().toUpperCase() as any;

    return this.repo.setStatus(oid, actorId, status);
  }
}