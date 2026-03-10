// src/modules/users/application/searchUsers.usecase.ts

import type { Role } from "@/src/generated/prisma";
import type { UserRepository } from "../domain/user.repository";
import { assertSearchUsersDTO, type SearchUsersDTO } from "./dtos/user.dto";

export class SearchUsersUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: unknown) {
    assertSearchUsersDTO(input);
    const dto = (input ?? {}) as SearchUsersDTO;

    const role = dto.role
      ? (String(dto.role).trim().toUpperCase() as Role)
      : undefined;

    const active =
      dto.active === undefined
        ? undefined
        : typeof dto.active === "boolean"
        ? dto.active
        : String(dto.active).trim().toLowerCase() === "true";

    return this.repo.list({
      q: String(dto.q ?? "").trim() || undefined,
      role,
      active,
      page: Math.max(1, Number(dto.page ?? 1)),
      pageSize: Math.max(1, Number(dto.pageSize ?? 10)),
    });
  }
}