// app/api/sale-orders/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaSaleOrderRepository } from "@/src/modules/saleOrders/infrastructure/saleOrder.repo";
import { CreateSaleOrderUseCase } from "@/src/modules/saleOrders/application/createSaleOrder.usecase";
import { SearchSaleOrdersUseCase } from "@/src/modules/saleOrders/application/searchSaleOrders.usecase";

function hasAnyRole(session: any, roles: string[]) {
  const role = String(session?.role ?? "").toUpperCase();
  return roles.includes(role);
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth();

    const url = new URL(req.url);
    const mine = String(url.searchParams.get("mine") ?? "").toLowerCase() === "true";

    // Si no es ADMIN, forzamos mine=true (solo ve sus pedidos)
    const isAdmin = hasAnyRole(session, ["ADMIN"]);
    const forcedMine = isAdmin ? mine : true;

    const repo = new PrismaSaleOrderRepository();
    const uc = new SearchSaleOrdersUseCase(repo);

    const result = await uc.execute({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,

      mine: forcedMine,
      userId: forcedMine ? session.userId : (url.searchParams.get("userId") ?? undefined),

      customerId: url.searchParams.get("customerId") ?? undefined,
      sellerId: url.searchParams.get("sellerId") ?? undefined,

      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,

      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 10),
    });

    return ok(result);
  } catch (e: any) {
    const msg = e?.message ?? "Error al listar pedidos";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    // Solo roles que pueden crear pedidos desde web (usuario logueado)
    if (!hasAnyRole(session, ["USER", "SELLER", "ADMIN"])) {
      return fail("No autorizado", 401);
    }

    if (!body || typeof body !== "object") {
      return fail("Body inválido", 400);
    }

    /**
     * ✅ MODO WEB (este endpoint)
     * - El comprador es el usuario logueado
     * - No aceptamos customerId ni userId del body (evita spoofing)
     */
    (body as any).userId = session.userId;
    (body as any).customerId = null;

    // sellerId opcional solo si lo permite un ADMIN/SELLER (ej: asignar vendedor)
    if (!hasAnyRole(session, ["ADMIN", "SELLER"])) {
      (body as any).sellerId = null;
    }

    const repo = new PrismaSaleOrderRepository();
    const uc = new CreateSaleOrderUseCase(repo);

    const created = await uc.execute(body, session.userId);

    return ok(created);
  } catch (e: any) {
    const msg = e?.message ?? "Error al crear pedido";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}