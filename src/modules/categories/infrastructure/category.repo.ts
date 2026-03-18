// src/modules/categories/infrastructure/category.repo.ts
import { prisma } from "@/src/shared/db/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import type {
  CategoryRepository,
  CategoryRecord,
  CategoryListParams,
  CategoryListResult,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../domain/category.repository";

import {
  normalizeText,
  normalizeCategoryStatus,
} from "../domain/category.rules";
import { CategoryStatus, isCategoryStatus } from "../domain/category-status";


/** ===================== Helpers ===================== */

function mapCategory(c: Prisma.CategoryGetPayload<{}>): CategoryRecord {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    status: c.status as CategoryStatus,
    archivedAt: c.archivedAt ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function parseStatusFilter(v?: string): CategoryStatus | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;

  const s = String(v).trim().toUpperCase();
  if (!isCategoryStatus(s)) throw new Error("status inválido");
  if (s === "ARCHIVED") throw new Error("No se permite buscar categorías archivadas");

  return s;
}

/** ===================== Repository ===================== */

export class PrismaCategoryRepository implements CategoryRepository {
  async getById(id: string): Promise<CategoryRecord | null> {
    const c = await prisma.category.findUnique({ where: { id } });
    return c ? mapCategory(c) : null;
  }

  async getByName(name: string): Promise<CategoryRecord | null> {
    const n = String(name ?? "").trim();
    if (!n) return null;

    const c = await prisma.category.findFirst({
      where: {
        name: { equals: n, mode: "insensitive" },
        status: { in: ["ACTIVE", "INACTIVE"] },
      },
    });

    return c ? mapCategory(c) : null;
  }

  async list(params: CategoryListParams): Promise<CategoryListResult> {
    const q = String(params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CategoryWhereInput = {};

    const status = parseStatusFilter(params.status as string | undefined);

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["ACTIVE", "INACTIVE"] };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(mapCategory),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async create(input: CreateCategoryInput): Promise<CategoryRecord> {
    const name = normalizeText(input.name);
    if (!name) throw new Error("name requerido");

    const description = normalizeText(input.description);
    const status = normalizeCategoryStatus(input.status, "ACTIVE");

    const dup = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        status: { in: ["ACTIVE", "INACTIVE"] },
      },
      select: { id: true },
    });

    if (dup) throw new Error("La categoría ya existe");

    const created = await prisma.category.create({
      data: {
        name,
        description: description ?? null,
        status,
        archivedAt: status === "ARCHIVED" ? new Date() : null,
      },
    });

    return mapCategory(created);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({ where: { id } });
      if (!existing) throw new Error("Categoría no encontrada");

      const data: Prisma.CategoryUpdateInput = {};

      if (input.name !== undefined) {
        const v = normalizeText(input.name);
        if (!v) throw new Error("name inválido");

        const dup = await tx.category.findFirst({
          where: {
            name: { equals: v, mode: "insensitive" },
            NOT: { id },
            status: { in: ["ACTIVE", "INACTIVE"] },
          },
          select: { id: true },
        });

        if (dup) throw new Error("Ya existe otra categoría con ese nombre");

        data.name = v;
      }

      if (input.description !== undefined) {
        data.description = normalizeText(input.description) ?? null;
      }

      if (input.status !== undefined) {
        const status = normalizeCategoryStatus(input.status);

        data.status = status;
        data.archivedAt = status === "ARCHIVED" ? new Date() : null;
      }

      const updated = await tx.category.update({
        where: { id },
        data,
      });

      return mapCategory(updated);
    });
  }

  async archive(id: string): Promise<void> {
    const c = await prisma.category.findUnique({ where: { id } });
    if (!c) return;

    if (c.status === "ARCHIVED") return;

    await prisma.category.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }
}