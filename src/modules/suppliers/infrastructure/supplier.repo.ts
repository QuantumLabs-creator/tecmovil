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
  normalizeEmail,
  normalizeSupplierStatus,
} from "../domain/supplier.rules";
import { isSupplierStatus, type SupplierStatus } from "../domain/supplier-status";

/** ===================== Helpers ===================== */

function mapSupplier(s: Prisma.SupplierGetPayload<{}>): SupplierRecord {
  return {
    id: s.id,
    name: s.name,
    contact: s.contact ?? null,
    email: s.email ?? null,
    phone: s.phone ?? null,
    address: s.address ?? null,
    status: s.status as SupplierStatus,
    archivedAt: s.archivedAt ?? null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function parseStatusFilter(v?: string): SupplierStatus | undefined {
  if (!v || !String(v).trim()) return undefined;

  const s = String(v).trim().toUpperCase();
  if (!isSupplierStatus(s)) throw new Error("status inválido");
  if (s === "ARCHIVED") throw new Error("No se permite buscar proveedores archivados");

  return s;
}

/** ===================== Repository ===================== */

export class PrismaSupplierRepository implements SupplierRepository {
  async getById(id: string): Promise<SupplierRecord | null> {
    const s = await prisma.supplier.findUnique({ where: { id } });
    return s ? mapSupplier(s) : null;
  }

  async getByName(name: string): Promise<SupplierRecord | null> {
    const n = String(name ?? "").trim();
    if (!n) return null;

    const s = await prisma.supplier.findFirst({
      where: {
        name: { equals: n, mode: "insensitive" },
        status: { in: ["ACTIVE", "INACTIVE"] },
      },
    });

    return s ? mapSupplier(s) : null;
  }

  async list(params: SupplierListParams): Promise<SupplierListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.SupplierWhereInput = {};

    const status = parseStatusFilter(params.status as string | undefined);
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["ACTIVE", "INACTIVE"] };
    }

    const q = String(params.q ?? "").trim();
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

  async create(input: CreateSupplierInput): Promise<SupplierRecord> {
    const name = normalizeText(input.name);
    if (!name) throw new Error("name requerido");

    const email = normalizeEmail(input.email);
    const status = normalizeSupplierStatus(input.status, "ACTIVE");

    const created = await prisma.supplier.create({
      data: {
        name,
        contact: normalizeText(input.contact) ?? null,
        email,
        phone: normalizeText(input.phone) ?? null,
        address: normalizeText(input.address) ?? null,
        status,
        archivedAt: status === "ARCHIVED" ? new Date() : null,
      },
    });

    return mapSupplier(created);
  }

  async update(id: string, input: UpdateSupplierInput): Promise<SupplierRecord> {
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

      if (input.status !== undefined) {
        const status = normalizeSupplierStatus(input.status);
        data.status = status;
        data.archivedAt = status === "ARCHIVED" ? new Date() : null;
      }

      const updated = await tx.supplier.update({ where: { id }, data });
      return mapSupplier(updated);
    });
  }

  async archive(id: string): Promise<void> {
    const s = await prisma.supplier.findUnique({ where: { id } });
    if (!s) return;

    if (s.status === "ARCHIVED") return;

    await prisma.supplier.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }
}