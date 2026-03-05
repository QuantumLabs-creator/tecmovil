// app/api/sale-orders/[id]/reject/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { RejectSaleOrderUseCase } from "@/src/modules/saleOrders/application/rejectSaleOrder.usecase";

function isAdmin(session: any) {
  return String(session?.role ?? "").toUpperCase() === "ADMIN";
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return fail("No autorizado", 401);

    const body = await req.json();

    const repo = new PrismaSaleOrderRepository();
    const uc = new RejectSaleOrderUseCase(repo);

    const data = await uc.execute(ctx.params.id, session.userId, body);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al rechazar pedido";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}