// src/modules/movements/infrastructure/movement.repo.ts

import { prisma } from "@/src/shared/db/prisma";
import type { Prisma, $Enums } from "@/src/generated/prisma/client";

import type {
  MovementRepository,
  MovementRecord,
  MovementListParams,
  MovementListResult,
  CreateMovementInput,
} from "../domain/movement.repository";

import { normalizeMoney } from "@/src/modules/products/domain/product.rules";
import { applyMovement, normalizeQuantity } from "../domain/movement.rules";
import { MovementEntity } from "../domain/movement.entity";

/** ===================== Helpers ===================== */

function mapMovement(
  m: Prisma.MovementGetPayload<{ include: { product: true; user: true } }>
): MovementRecord {
  return {
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    stockBefore: m.stockBefore,
    stockAfter: m.stockAfter,
    reason: m.reason ?? null,
    unitPrice: m.unitPrice ?? null,
    reference: m.reference ?? null,
    createdAt: m.createdAt,
    productId: m.productId,
    userId: m.userId,
    product: { id: m.product.id, code: m.product.code, name: m.product.name },
    user: { id: m.user.id, name: m.user.name, email: m.user.email },
  };
}

function safeStr(v?: string | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

/** ===================== Repository ===================== */

export class PrismaMovementRepository implements MovementRepository {
  async getById(id: string): Promise<MovementRecord | null> {
    const m = await prisma.movement.findUnique({
      where: { id },
      include: { product: true, user: true },
    });
    return m ? mapMovement(m) : null;
  }

  async list(params: MovementListParams): Promise<MovementListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.MovementWhereInput = {};

    const productId = safeStr(params.productId);
    if (productId) where.productId = productId;

    const userId = safeStr(params.userId);
    if (userId) where.userId = userId;

    const type = safeStr(params.type);
    if (type) where.type = type as any;

    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as any).gte = new Date(params.from);
      if (params.to) (where.createdAt as any).lte = new Date(params.to);
    }

    const [total, items] = await Promise.all([
      prisma.movement.count({ where }),
      prisma.movement.findMany({
        where,
        include: { product: true, user: true },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(mapMovement),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async create(input: CreateMovementInput): Promise<MovementRecord> {
    const productId = String(input.productId ?? "").trim();
    const userId = String(input.userId ?? "").trim();

    // ✅ enum correcto (no Prisma.MovementType)
    const type = String(input.type ?? "").trim() as $Enums.MovementType;

    if (!productId) throw new Error("productId requerido");
    if (!userId) throw new Error("userId requerido");
    if (!type) throw new Error("type requerido");

    const qty = normalizeQuantity(input.quantity);

    // money opcional
    const unitPrice =
      input.unitPrice === undefined || input.unitPrice === null || String(input.unitPrice).trim() === ""
        ? null
        : normalizeMoney(input.unitPrice, "unitPrice");

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, active: true, currentStock: true, reservedStock: true },
      });
      if (!product) throw new Error("Producto no existe");
      if (!product.active) throw new Error("Producto inactivo");

      // ✅ aplica reglas
      const effect = applyMovement(type, qty, {
        currentStock: product.currentStock,
        reservedStock: product.reservedStock,
      });

      // ✅ usa entity para construir el "data" final validado
      const entity = MovementEntity.create({
        type,
        quantity: qty,
        stockBefore: effect.stockBefore,
        stockAfter: effect.stockAfter,
        reason: input.reason ?? null,
        unitPrice,
        reference: input.reference ?? null,
        productId: product.id,
        userId,
      });

      // 1) crear movimiento
      const created = await tx.movement.create({
        data: entity,
        include: { product: true, user: true },
      });

      // 2) actualizar stock producto
      await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: effect.stockAfter,
          reservedStock: effect.reservedAfter,
        },
      });

      return mapMovement(created);
    });
  }
} 