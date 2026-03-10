// src/modules/suppliers/infrastructure/supplier.repo.ts
import { prisma } from "@/src/shared/db/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import type {
  SupplierRepository,
  SupplierRecord,
  SupplierListParams,
  SupplierListResult,
  CreateSupplierInput,
  UpdateSupplierInput,
} from "../domain/supplier.repository";

import {
  normalizeText,
  normalizeBoolean,
  normalizeEmail,
} from "../domain/supplier.rules";

/** ===================== Helpers ===================== */

function mapSupplier(s: Prisma.SupplierGetPayload<{}>): SupplierRecord {
  return {
    id: s.id,
    name: s.name,
    contact: s.contact ?? null,
    email: s.email ?? null,
    phone: s.phone ?? null,
    address: s.address ?? null,
    active: s.active,
    createdAt: s.createdAt,
  };
}

function parseActiveFilter(v?: string): boolean | undefined {
  if (!v || !String(v).trim()) return undefined;
  return String(v).toLowerCase() === "true";
}

/** ===================== Repository ===================== */

export class PrismaSupplierRepository implements SupplierRepository {
  async getById(id: string) {
    const s = await prisma.supplier.findUnique({ where: { id } });
    return s ? mapSupplier(s) : null;
  }

  async getByName(name: string) {
    const n = String(name ?? "").trim();
    if (!n) return null;

    const s = await prisma.supplier.findFirst({
      where: { name: { equals: n, mode: "insensitive" } },
    });

    return s ? mapSupplier(s) : null;
  }

  async list(params: SupplierListParams): Promise<SupplierListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.SupplierWhereInput = {};

    const active = parseActiveFilter(params.active);
    if (active !== undefined) where.active = active;

    const q = (params.q ?? "").trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { contact: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(mapSupplier),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async create(input: CreateSupplierInput) {
    const name = normalizeText(input.name);
    if (!name) throw new Error("name requerido");

    const created = await prisma.supplier.create({
      data: {
        name,
        contact: normalizeText(input.contact) ?? null,
        email: normalizeEmail(input.email),
        phone: normalizeText(input.phone) ?? null,
        address: normalizeText(input.address) ?? null,
        active: normalizeBoolean(input.active, true),
      },
    });

    return mapSupplier(created);
  }

  async update(id: string, input: UpdateSupplierInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supplier.findUnique({ where: { id } });
      if (!existing) throw new Error("Proveedor no encontrado");

      const data: Prisma.SupplierUpdateInput = {};

      if (input.name !== undefined) {
        const v = normalizeText(input.name);
        if (!v) throw new Error("name inválido");
        data.name = v;
      }

      if (input.contact !== undefined) {
        data.contact = normalizeText(input.contact) ?? null;
      }

      if (input.email !== undefined) {
        data.email = normalizeEmail(input.email);
      }

      if (input.phone !== undefined) {
        data.phone = normalizeText(input.phone) ?? null;
      }

      if (input.address !== undefined) {
        data.address = normalizeText(input.address) ?? null;
      }

      if (input.active !== undefined) {
        data.active = normalizeBoolean(input.active, true);
      }

      const updated = await tx.supplier.update({ where: { id }, data });
      return mapSupplier(updated);
    });
  }

  async delete(id: string) {
    await prisma.supplier.update({
      where: { id },
      data: { active: false }, // soft delete
    });
  }
}