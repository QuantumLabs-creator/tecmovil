// app/api/users/[id]/route.ts

import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaUserRepository } from "@/src/modules/users/infrastructure/user.repo";
import { GetUserUseCase } from "@/src/modules/users/application/getUser.usecase";
import { UpdateUserUseCase } from "@/src/modules/users/application/updateUser.usecase";

function isAdmin(session: any) {
  return String(session?.role ?? "").toUpperCase() === "ADMIN";
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session)) {
      return fail("No autorizado", 403);
    }

    const repo = new PrismaUserRepository();
    const uc = new GetUserUseCase(repo);

    const data = await uc.execute(ctx.params.id);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener usuario";
    const status = msg === "No autorizado" ? 401 : 404;
    return fail(msg, status);
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session)) {
      return fail("No autorizado", 403);
    }

    const body = await req.json();

    const repo = new PrismaUserRepository();
    const uc = new UpdateUserUseCase(repo);

    const data = await uc.execute(ctx.params.id, body);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al actualizar usuario";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}