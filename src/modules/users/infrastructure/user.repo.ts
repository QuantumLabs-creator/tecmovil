// src/modules/users/infrastructure/user.repo.ts

import { prisma } from "@/src/shared/db/prisma";
import type { Prisma, Role } from "@/src/generated/prisma";

import type {
  UserRepository,
  UserRecord,
  UserListParams,
  UserListResult,
  UpdateUserInput,
} from "../domain/user.repository";

/** ===================== Helpers ===================== */

function mapUser(
  u: Prisma.UserGetPayload<Record<string, never>>
): UserRecord {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    active: u.active,
    lastLogin: u.lastLogin ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function safeStr(v?: string | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

function parseActive(v?: unknown): boolean | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  if (typeof v === "boolean") return v;
  return String(v).trim().toLowerCase() === "true";
}

/** ===================== Repository ===================== */

export class PrismaUserRepository implements UserRepository {
  async getById(id: string): Promise<UserRecord | null> {
    const u = await prisma.user.findUnique({
      where: { id },
    });

    return u ? mapUser(u) : null;
  }

  async list(params: UserListParams): Promise<UserListResult> {
    const q = String(params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(200, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {};

    const role = safeStr(params.role);
    if (role) {
      where.role = role as Role;
    }

    const active = parseActive(params.active);
    if (active !== undefined) {
      where.active = active;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(mapUser),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<UserRecord> {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) throw new Error("Usuario no encontrado");

    const data: Prisma.UserUpdateInput = {};

    if (input.name !== undefined) {
      const name = String(input.name ?? "").trim();
      if (!name) throw new Error("name inválido");
      data.name = name;
    }

    if (input.phone !== undefined) {
      data.phone = input.phone ? String(input.phone).trim() : null;
    }

    if (input.role !== undefined) {
      data.role = input.role;
    }

    if (input.active !== undefined) {
      data.active = input.active;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return mapUser(updated);
  }
}