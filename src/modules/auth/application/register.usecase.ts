
import { AuthRepository } from "../domain/auth.repository";
import { assertSelfRegisterRole } from "../domain/auth.rules";
import { hashPassword, signAccessToken } from "../infrastructure/auth.utils";
import { RegisterDTO, registerSchema } from "./dtos/auth.dto";

export async function registerUseCase(repo: AuthRepository, input: RegisterDTO) {
  const dto = registerSchema.parse(input);

  const exists = await repo.findByEmail(dto.email);
  if (exists) throw new Error("Email ya registrado");

  assertSelfRegisterRole(dto.role);

  const user = await repo.createUser({
    name: dto.name,
    email: dto.email,
    password: await hashPassword(dto.password),
    phone: dto.phone ?? null,
    role: dto.role,
  });

  const accessToken = await signAccessToken({ sub: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      active: user.active,
    },
    accessToken,
  };
}