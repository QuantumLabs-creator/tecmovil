import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { CancelSaleOrderUseCase } from "@/src/modules/saleOrders/application/cancelSaleOrder.usecase";

function hasAnyRole(role: string, roles: string[]) {
  return roles.includes(String(role ?? "").toUpperCase());
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const params = await ctx.params;
    const body = await req.json();

    const repo = new PrismaSaleOrderRepository();

    const order = await repo.getById(params.id);
    if (!order) return fail("Pedido no encontrado", 404);

    const isPrivileged = hasAnyRole(session.role, ["ADMIN"]);

    if (!isPrivileged) {
      if (!order.userId || order.userId !== session.userId) {
        return fail("No autorizado", 403);
      }
    }

    const uc = new CancelSaleOrderUseCase(repo);
    const data = await uc.execute(params.id, session.userId, body);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al cancelar pedido";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}