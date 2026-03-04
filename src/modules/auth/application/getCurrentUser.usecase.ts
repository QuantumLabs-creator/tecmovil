import type { AuthRepository } from "../domain/auth.repository";
import { verifyAccessToken } from "../infrastructure/auth.utils";

export async function getCurrentUserUseCase(repo: AuthRepository, token: string) {
  const payload = await verifyAccessToken(token);

  const user = await repo.findById(payload.sub);
  if (!user || !user.active) {
    throw new Error("No autenticado");
  }

  return user;
}