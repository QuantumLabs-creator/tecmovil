// app/api/users/route.ts

import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaUserRepository } from "@/src/modules/users/infrastructure/user.repo";
import { SearchUsersUseCase } from "@/src/modules/users/application/searchUsers.usecase";

function isAdmin(session: any) {
  return String(session?.role ?? "").toUpperCase() === "ADMIN";
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth();

    if (!isAdmin(session)) {
      return fail("No autorizado", 403);
    }

    const url = new URL(req.url);

    const repo = new PrismaUserRepository();
    const uc = new SearchUsersUseCase(repo);

    const result = await uc.execute({
      q: url.searchParams.get("q") ?? undefined,
      role: url.searchParams.get("role") ?? undefined,
      active: url.searchParams.get("active") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 10),
    });

    return ok(result);
  } catch (e: any) {
    const msg = e?.message ?? "Error al listar usuarios";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}