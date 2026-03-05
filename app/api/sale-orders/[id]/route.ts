// app/api/sale-orders/[id]/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { GetSaleOrderUseCase } from "@/src/modules/saleOrders/application/getSaleOrder.usecase";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    await requireAuth();

    const repo = new PrismaSaleOrderRepository();
    const uc = new GetSaleOrderUseCase(repo);

    const data = await uc.execute(ctx.params.id);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener pedido";
    const status = msg === "No autorizado" ? 401 : 404;
    return fail(msg, status);
  }
}