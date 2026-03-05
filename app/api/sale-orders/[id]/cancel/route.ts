// app/api/sale-orders/[id]/cancel/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { CancelSaleOrderUseCase } from "@/src/modules/saleOrders/application/cancelSaleOrder.usecase";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const repo = new PrismaSaleOrderRepository();
    const uc = new CancelSaleOrderUseCase(repo);

    const data = await uc.execute(ctx.params.id, session.userId, body);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al cancelar pedido";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}