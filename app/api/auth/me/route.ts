export const runtime = "nodejs";

import { ok, fail } from "@/src/shared/http/api";
import { cookies } from "next/headers";
import { PrismaAuthRepository } from "@/src/modules/auth/infrastructure/auth.repo";
import { getCurrentUserUseCase } from "@/src/modules/auth/application/getCurrentUser.usecase";

export async function GET() {
  try {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) return fail("No autenticado", 401);

    const repo = new PrismaAuthRepository();
    const user = await getCurrentUserUseCase(repo, token);

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        active: user.active,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (e: any) {
    return fail(e?.message ?? "No autenticado", 401);
  }
}