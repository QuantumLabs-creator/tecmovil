import type { SaleOrderRepository } from "../domain/saleOrder.repository";

export class ApproveSaleOrderUseCase {
  constructor(private readonly repo: SaleOrderRepository) {}

  async execute(id: string, adminId: string) {
    const oid = String(id ?? "").trim();
    if (!oid) throw new Error("id requerido");
    return this.repo.approve(oid, adminId);
  }
}