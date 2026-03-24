// src/modules/auth/application/verifyAdmin.usecase.ts

import type { AuthRepository } from "../domain/auth.repository";

export class VerifyAdminUseCase {
  constructor(private readonly repo: AuthRepository) {}

  async execute(email: string, password: string) {
    if (!email || !password) {
      throw new Error("Email y contraseña requeridos");
    }

    const user = await this.repo.findByEmail(email);

    if (!user) return false;

    if (user.role !== "ADMIN") return false;

    const isValid = await this.repo.comparePassword(password, user.password);

    return isValid;
  }
}