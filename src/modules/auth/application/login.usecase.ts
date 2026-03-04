

import { verifyPassword, signAccessToken } from "../../auth/infrastructure/auth.utils";
import { AuthRepository } from "../domain/auth.repository";
import { assertActiveUser } from "../domain/auth.rules";
import { LoginDTO, loginSchema } from "./dtos/auth.dto";

export async function loginUseCase(repo: AuthRepository, input: LoginDTO) {
  const dto = loginSchema.parse(input);

  const user = await repo.findByEmail(dto.email);
  if (!user) throw new Error("Credenciales inválidas");

  assertActiveUser(user.active);

  const ok = await verifyPassword(dto.password, user.password);
  if (!ok) throw new Error("Credenciales inválidas");

  await repo.updateLastLogin(user.id, new Date());

  const accessToken = await signAccessToken({ sub: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      active: user.active,
      lastLogin: user.lastLogin,
    },
    accessToken,
  };
}