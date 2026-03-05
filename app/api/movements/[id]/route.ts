import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaMovementRepository } from "@/src/modules/movements/infrastructure/movement.repo";
import { GetMovementUseCase } from "@/src/modules/movements/application/getMovement.usecase";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth();

    const repo = new PrismaMovementRepository();
    const uc = new GetMovementUseCase(repo);

    const movement = await uc.execute(params.id);

    return ok(movement);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener movimiento";
    const status = msg === "No autorizado" ? 401 : 404;
    return fail(msg, status);
  }
}