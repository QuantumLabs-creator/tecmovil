// app/api/sale-orders/[id]/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { GetSaleOrderUseCase } from "@/src/modules/saleOrders/application/getSaleOrder.usecase";

function hasAnyRole(role: string, roles: string[]) {
  return roles.includes(String(role ?? "").toUpperCase());
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    const repo = new PrismaSaleOrderRepository();
    const uc = new GetSaleOrderUseCase(repo);

    const data = await uc.execute(ctx.params.id);

    if (!data) {
      return fail("Pedido no encontrado", 404);
    }

    const isPrivileged = hasAnyRole(session.role, ["ADMIN", "SELLER", "WAREHOUSE"]);

    // ✅ si es USER, solo puede ver su propio pedido
    if (!isPrivileged) {
      if (!data.userId || data.userId !== session.userId) {
        return fail("No autorizado", 403);
      }
    }

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener pedido";
    const status = msg === "No autorizado" ? 401 : 404;
    return fail(msg, status);
  }
}