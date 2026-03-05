import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaMovementRepository } from "@/src/modules/movements/infrastructure/movement.repo";
import { CreateMovementUseCase } from "@/src/modules/movements/application/createMovement.usecase";
import { SearchMovementsUseCase } from "@/src/modules/movements/application/searchMovements.usecase";

export async function GET(req: Request) {
  try {
    await requireAuth(); // si quieres que listar requiera login

    const url = new URL(req.url);

    const repo = new PrismaMovementRepository();
    const uc = new SearchMovementsUseCase(repo);

    const result = await uc.execute({
      productId: url.searchParams.get("productId") ?? undefined,
      userId: url.searchParams.get("userId") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 10),
    });

    return ok(result);
  } catch (e: any) {
    const msg = e?.message ?? "Error al listar movimientos";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const repo = new PrismaMovementRepository();
    const uc = new CreateMovementUseCase(repo);

    const created = await uc.execute(body, session.userId);

    return ok(created);
  } catch (e: any) {
    const msg = e?.message ?? "Error al crear movimiento";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}