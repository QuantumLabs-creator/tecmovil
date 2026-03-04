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
    normalizeBoolean,
} from "../domain/unit.rules";

function mapUnit(u: Prisma.UnitOfMeasureGetPayload<{}>): UnitRecord {
    return {
        id: u.id,
        name: u.name,
        symbol: u.symbol ?? null,
        active: u.active,
    };
}

function parseActiveFilter(v?: string): boolean | undefined {
    if (!v || !String(v).trim()) return undefined;
    return String(v).toLowerCase() === "true";
}

export class PrismaUnitRepository implements UnitRepository {
    async getById(id: string) {
        const u = await prisma.unitOfMeasure.findUnique({ where: { id } });
        return u ? mapUnit(u) : null;
    }

    async getByName(name: string) {
        const u = await prisma.unitOfMeasure.findFirst({
            where: { name: { equals: name, mode: "insensitive" } },
        });
        return u ? mapUnit(u) : null;
    }

    async list(params: UnitListParams): Promise<UnitListResult> {
        const page = Math.max(1, Number(params.page ?? 1));
        const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
        const skip = (page - 1) * pageSize;

        const where: Prisma.UnitOfMeasureWhereInput = {};

        const active = parseActiveFilter(params.active);
        if (active !== undefined) where.active = active;

        if (params.q) {
            where.OR = [
                { name: { contains: params.q, mode: "insensitive" } },
                { symbol: { contains: params.q, mode: "insensitive" } },
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

    async create(input: CreateUnitInput) {
        const name = normalizeText(input.name);
        if (!name) throw new Error("name requerido");

        const created = await prisma.unitOfMeasure.create({
            data: {
                name,
                symbol: normalizeText(input.symbol) ?? null,
                active: normalizeBoolean(input.active, true),
            },
        });

        return mapUnit(created);
    }

    async update(id: string, input: UpdateUnitInput) {
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
                data.symbol = normalizeText(input.symbol) ?? null; // ✅ string | null
            }

            if (input.active !== undefined) {
                data.active = normalizeBoolean(input.active, true); // ✅ boolean
            }

            const updated = await tx.unitOfMeasure.update({
                where: { id },
                data,
            });

            return mapUnit(updated);
        });
    }

    async delete(id: string) {
        await prisma.unitOfMeasure.update({
            where: { id },
            data: { active: false }, // soft delete
        });
    }
}