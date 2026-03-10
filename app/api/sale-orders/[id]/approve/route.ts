import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { ApproveSaleOrderUseCase } from "@/src/modules/saleOrders/application/approveSaleOrder.usecase";

function isAdmin(session: any) {
  return String(session?.role ?? "").toUpperCase() === "ADMIN";
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return fail("No autorizado", 401);

    const params = await ctx.params;

    const repo = new PrismaSaleOrderRepository();
    const uc = new ApproveSaleOrderUseCase(repo);

    const data = await uc.execute(params.id, session.userId);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al aprobar pedido";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}