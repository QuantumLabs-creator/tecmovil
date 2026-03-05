import type { SaleOrderRepository, SaleOrderListResult } from "../domain/saleOrder.repository";

export class SearchSaleOrdersUseCase {
  constructor(private readonly repo: SaleOrderRepository) {}

  async execute(params: {
    q?: string;
    status?: string;
    mine?: boolean;
    userId?: string;
    customerId?: string;
    sellerId?: string;
    from?: string;
    to?: string;
    page: number;
    pageSize: number;
  }): Promise<SaleOrderListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(200, Math.max(5, Number(params.pageSize ?? 10)));

    return this.repo.list({
      q: params.q?.trim() || undefined,
      status: params.status?.trim() || undefined,
      mine: params.mine,
      userId: params.userId?.trim() || undefined,
      customerId: params.customerId?.trim() || undefined,
      sellerId: params.sellerId?.trim() || undefined,
      from: params.from,
      to: params.to,
      page,
      pageSize,
    });
  }
}