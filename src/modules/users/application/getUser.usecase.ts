// src/modules/users/application/getUser.usecase.ts

import type { UserRepository } from "../domain/user.repository";

export class GetUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(id: string) {
    const uid = String(id ?? "").trim();
    if (!uid) throw new Error("id requerido");

    const user = await this.repo.getById(uid);
    if (!user) throw new Error("Usuario no encontrado");

    return user;
  }
}