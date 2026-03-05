import type { SaleOrderRepository } from "../domain/saleOrder.repository";
import { assertRejectSaleOrderDTO } from "./dtos/saleOrder.dto";

export class RejectSaleOrderUseCase {
  constructor(private readonly repo: SaleOrderRepository) {}

  async execute(id: string, adminId: string, body: unknown) {
    const oid = String(id ?? "").trim();
    if (!oid) throw new Error("id requerido");

    assertRejectSaleOrderDTO(body);
    const reason = String((body as any).reason).trim();

    return this.repo.reject(oid, adminId, reason);
  }
}