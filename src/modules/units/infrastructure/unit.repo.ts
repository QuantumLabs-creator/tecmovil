// src/modules/units/infrastructure/unit.repo.ts
import { prisma } from "@/src/shared/db/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import type {
  UnitRepository,
  UnitRecord,
  UnitListParams,
  UnitListResult,
  CreateUnitInput,
  UpdateUnitInput,
} from "../domain/unit.repository";

import {
  normalizeText,
  normalizeUnitStatus,
} from "../domain/unit.rules";
import { isUnitStatus, type UnitStatus } from "../domain/unit-status";

function mapUnit(u: Prisma.UnitOfMeasureGetPayload<{}>): UnitRecord {
  return {
    id: u.id,
    name: u.name,
    symbol: u.symbol ?? null,
    status: u.status as UnitStatus,
    archivedAt: u.archivedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

function parseStatusFilter(v?: string): UnitStatus | undefined {
  if (!v || !String(v).trim()) return undefined;

  const s = String(v).trim().toUpperCase();
  if (!isUnitStatus(s)) throw new Error("status inválido");
  if (s === "ARCHIVED") throw new Error("No se permite buscar unidades archivadas");

  return s;
}

export class PrismaUnitRepository implements UnitRepository {
  async getById(id: string): Promise<UnitRecord | null> {
    const u = await prisma.unitOfMeasure.findUnique({ where: { id } });
    return u ? mapUnit(u) : null;
  }

  async getByName(name: string): Promise<UnitRecord | null> {
    const n = String(name ?? "").trim();
    if (!n) return null;

    const u = await prisma.unitOfMeasure.findFirst({
      where: {
        name: { equals: n, mode: "insensitive" },
        status: { in: ["ACTIVE", "INACTIVE"] },
      },
    });

    return u ? mapUnit(u) : null;
  }

  async list(params: UnitListParams): Promise<UnitListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.UnitOfMeasureWhereInput = {};

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
        { symbol: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.unitOfMeasure.count({ where }),
      prisma.unitOfMeasure.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(mapUnit),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async create(input: CreateUnitInput): Promise<UnitRecord> {
    const name = normalizeText(input.name);
    if (!name) throw new Error("name requerido");

    const status = normalizeUnitStatus(input.status, "ACTIVE");

    const created = await prisma.unitOfMeasure.create({
      data: {
        name,
        symbol: normalizeText(input.symbol) ?? null,
        status,
        archivedAt: status === "ARCHIVED" ? new Date() : null,
      },
    });

    return mapUnit(created);
  }

  async update(id: string, input: UpdateUnitInput): Promise<UnitRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.unitOfMeasure.findUnique({ where: { id } });
      if (!existing) throw new Error("Unidad no encontrada");

      const data: Prisma.UnitOfMeasureUpdateInput = {};

      if (input.name !== undefined) {
        const v = normalizeText(input.name);
        if (!v) throw new Error("name inválido");
        data.name = v;
      }

      if (input.symbol !== undefined) {
        data.symbol = normalizeText(input.symbol) ?? null;
      }

      if (input.status !== undefined) {
        const status = normalizeUnitStatus(input.status);
        data.status = status;
        data.archivedAt = status === "ARCHIVED" ? new Date() : null;
      }

      const updated = await tx.unitOfMeasure.update({
        where: { id },
        data,
      });

      return mapUnit(updated);
    });
  }

  async archive(id: string): Promise<void> {
    const u = await prisma.unitOfMeasure.findUnique({ where: { id } });
    if (!u) return;

    if (u.status === "ARCHIVED") return;

    await prisma.unitOfMeasure.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }
}