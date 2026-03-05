import type { SaleOrderRepository, SaleOrderRecord } from "../domain/saleOrder.repository";

export class GetSaleOrderUseCase {
  constructor(private readonly repo: SaleOrderRepository) {}

  async execute(id: string): Promise<SaleOrderRecord> {
    const oid = String(id ?? "").trim();
    if (!oid) throw new Error("id requerido");

    const o = await this.repo.getById(oid);
    if (!o) throw new Error("Pedido no encontrado");

    return o;
  }
}