// src/modules/users/application/dtos/user.dto.ts

import type { Role } from "@/src/generated/prisma";

export interface SearchUsersDTO {
  q?: string;
  role?: string;
  active?: string | boolean;
  page?: number;
  pageSize?: number;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string | null;
  role?: Role;
  active?: boolean;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

const allowedRoles: Role[] = ["ADMIN", "USER", "WAREHOUSE", "SELLER"];

export function assertSearchUsersDTO(input: unknown): asserts input is SearchUsersDTO {
  if (!input || typeof input !== "object") return;

  const x = input as Record<string, unknown>;

  if (!isBlank(x.role)) {
    const role = String(x.role).trim().toUpperCase() as Role;
    if (!allowedRoles.includes(role)) {
      throw new Error("role inválido");
    }
  }

  if (!isBlank(x.page)) {
    const page = Number(x.page);
    if (!Number.isFinite(page) || page < 1) {
      throw new Error("page inválido");
    }
  }

  if (!isBlank(x.pageSize)) {
    const pageSize = Number(x.pageSize);
    if (!Number.isFinite(pageSize) || pageSize < 1) {
      throw new Error("pageSize inválido");
    }
  }
}

export function assertUpdateUserDTO(input: unknown): asserts input is UpdateUserDTO {
  if (!input || typeof input !== "object") {
    throw new Error("Body inválido");
  }

  const x = input as Record<string, unknown>;

  if (x.role !== undefined && x.role !== null) {
    const role = String(x.role).trim().toUpperCase() as Role;
    if (!allowedRoles.includes(role)) {
      throw new Error("role inválido");
    }
  }

  if (x.active !== undefined && typeof x.active !== "boolean") {
    throw new Error("active inválido");
  }

  if (x.name !== undefined) {
    const name = String(x.name ?? "").trim();
    if (!name) throw new Error("name inválido");
  }

  if (x.phone !== undefined && x.phone !== null) {
    const phone = String(x.phone).trim();
    if (!phone) throw new Error("phone inválido");
  }
}