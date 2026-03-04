
import { ok, fail } from "@/src/shared/http/api";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/src/modules/auth/infrastructure/auth.utils";
import { PrismaAuthRepository } from "@/src/modules/auth/infrastructure/auth.repo";


export async function GET() {
  try {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) return fail("No autenticado", 401);

    const payload = await verifyAccessToken(token);

    const repo = new PrismaAuthRepository();
    const user = await repo.findById(payload.sub);

    if (!user || !user.active) return fail("No autenticado", 401);

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
  } catch {
    return fail("No autenticado", 401);
  }
}