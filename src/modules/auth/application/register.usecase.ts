import type { AuthRepository } from "../domain/auth.repository";
import { hashPassword, signAccessToken } from "../infrastructure/auth.utils";
import { RegisterDTO, registerSchema } from "./dtos/auth.dto";

export async function registerUseCase(repo: AuthRepository, input: RegisterDTO) {
  const dto = registerSchema.parse(input);

  const exists = await repo.findByEmail(dto.email);
  if (exists) throw new Error("Email ya registrado");

  const passwordHash = await hashPassword(dto.password);

  const result = await repo.registerCustomerUser({
    name: dto.name,
    email: dto.email,
    password: passwordHash,
    phone: dto.phone ?? null,
    customerType: "RETAIL",
    document: null,
  });

  const accessToken = await signAccessToken({
    sub: result.user.id,
    role: result.user.role,
  });

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone ?? null,
      role: result.user.role,
      active: result.user.active,
    },
    customer: result.customer,
    accessToken,
  };
}