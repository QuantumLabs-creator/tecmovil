// app/api/sale-orders/[id]/status/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { SetSaleOrderStatusUseCase } from "@/src/modules/saleOrders/application/setSaleOrderStatus.usecase";

function canManage(session: any) {
  const role = String(session?.role ?? "").toUpperCase();
  return ["ADMIN", "WAREHOUSE", "SELLER"].includes(role);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (!canManage(session)) return fail("No autorizado", 401);

    const body = await req.json();

    const repo = new PrismaSaleOrderRepository();
    const uc = new SetSaleOrderStatusUseCase(repo);

    const data = await uc.execute(ctx.params.id, session.userId, body);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al cambiar estado";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}