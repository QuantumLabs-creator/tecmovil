
import { ok, fail } from "@/src/shared/http/api";
import { buildAuthCookieOptions } from "@/src/modules/auth/infrastructure/auth.utils";
import { PrismaAuthRepository } from "@/src/modules/auth/infrastructure/auth.repo";
import { loginUseCase } from "@/src/modules/auth/application/login.usecase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const repo = new PrismaAuthRepository();
    const result = await loginUseCase(repo, body);

    const res = ok({ user: result.user });
    res.cookies.set("access_token", result.accessToken, buildAuthCookieOptions());
    return res;
  } catch (e: any) {
    const msg = e?.message ?? "Error en login";
    const status = msg.includes("Credenciales") ? 401 : 400;
    return fail(msg, status);
  }
}