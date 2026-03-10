// src/modules/users/application/updateUser.usecase.ts

import type { Role } from "@/src/generated/prisma";
import type { UserRepository } from "../domain/user.repository";
import { assertUpdateUserDTO, type UpdateUserDTO } from "./dtos/user.dto";

export class UpdateUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(id: string, input: unknown) {
    const uid = String(id ?? "").trim();
    if (!uid) throw new Error("id requerido");

    assertUpdateUserDTO(input);
    const dto = input as UpdateUserDTO;

    return this.repo.update(uid, {
      name: dto.name !== undefined ? String(dto.name).trim() : undefined,
      phone:
        dto.phone !== undefined
          ? dto.phone === null
            ? null
            : String(dto.phone).trim()
          : undefined,
      role:
        dto.role !== undefined
          ? (String(dto.role).trim().toUpperCase() as Role)
          : undefined,
      active: dto.active,
    });
  }
}