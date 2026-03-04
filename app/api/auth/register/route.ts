
import { created, fail } from "@/src/shared/http/api";
import { buildAuthCookieOptions } from "@/src/modules/auth/infrastructure/auth.utils";
import { PrismaAuthRepository } from "@/src/modules/auth/infrastructure/auth.repo";
import { registerUseCase } from "@/src/modules/auth/application/register.usecase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const repo = new PrismaAuthRepository();
    const result = await registerUseCase(repo, body);

    const res = created({ user: result.user });
    res.cookies.set("access_token", result.accessToken, buildAuthCookieOptions());
    return res;
  } catch (e: any) {
    const msg = e?.message ?? "Error en registro";
    const status = msg.includes("ya registrado") ? 409 : 400;
    return fail(msg, status);
  }
}