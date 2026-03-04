// src/modules/products/infrastructure/product.repo.ts
import { prisma } from "@/src/shared/db/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import type {
  ProductRepository,
  ProductRecord,
  ProductListParams,
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
} from "../domain/product.repository";

import {
  normalizeText,
  normalizeBoolean,
  normalizeInt,
  normalizeMoney,
} from "../domain/product.rules";

/** ===================== Helpers ===================== */

async function generateProductCode(tx: Prisma.TransactionClient) {
  const last = await tx.product.findFirst({
    orderBy: { createdAt: "desc" },
    select: { code: true },
  });

  if (!last?.code) return "PROD-0001";

  const match = String(last.code).match(/PROD-(\d+)/i);
  const lastNumber = match ? Number(match[1]) : 0;

  const next = lastNumber + 1;
  return `PROD-${String(next).padStart(4, "0")}`;
}

function mapProduct(
  p: Prisma.ProductGetPayload<{ include: { category: true; supplier: true; unit: true } }>
) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description ?? null,
    image: p.image ?? null,

    purchasePrice: p.purchasePrice,
    retailPrice: p.retailPrice,
    wholesalePrice: p.wholesalePrice ?? null,
    wholesaleMinQuantity: p.wholesaleMinQuantity,

    minSalePrice: p.minSalePrice ?? null,
    maxSalePrice: p.maxSalePrice ?? null,

    minStock: p.minStock,
    currentStock: p.currentStock,
    reservedStock: p.reservedStock,

    active: p.active,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,

    categoryId: p.categoryId,
    supplierId: p.supplierId ?? null,
    unitId: p.unitId,

    category: { id: p.category.id, name: p.category.name },
    supplier: p.supplier ? { id: p.supplier.id, name: p.supplier.name } : null,
    unit: { id: p.unit.id, name: p.unit.name, symbol: p.unit.symbol ?? null },
  };
}

function safeStr(v?: string | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

function parseActiveFilter(v?: string): boolean | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  return normalizeBoolean(v, true);
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

/** ===================== Repository ===================== */

export class PrismaProductRepository implements ProductRepository {
  async getById(id: string): Promise<ProductRecord | null> {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true, unit: true },
    });
    return p ? mapProduct(p) : null;
  }

  async getByCode(code: string): Promise<ProductRecord | null> {
    const c = String(code ?? "").trim();
    if (!c) return null;

    const p = await prisma.product.findUnique({
      where: { code: c },
      include: { category: true, supplier: true, unit: true },
    });

    return p ? mapProduct(p) : null;
  }

  async list(params: ProductListParams): Promise<ProductListResult> {
    const q = (params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {};

    const active = parseActiveFilter(params.active);
    if (active !== undefined) where.active = active;

    const categoryId = safeStr(params.categoryId);
    if (categoryId) where.categoryId = categoryId;

    const supplierId = safeStr(params.supplierId);
    if (supplierId) where.supplierId = supplierId;

    const unitId = safeStr(params.unitId);
    if (unitId) where.unitId = unitId;

    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { supplier: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true, supplier: true, unit: true },
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    let mapped = items.map(mapProduct);

    if (params.lowStock === true) {
      mapped = mapped.filter((p) => p.currentStock <= p.minStock);
    }

    return {
      items: mapped,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async create(input: CreateProductInput): Promise<ProductRecord> {
    return prisma.$transaction(async (tx) => {
      const code = await generateProductCode(tx);

      const name = normalizeText(input.name);
      if (!name) throw new Error("name requerido");

      const description = normalizeText(input.description);

      const purchasePrice = normalizeMoney(input.purchasePrice, "purchasePrice");
      const salePrice = normalizeMoney(input.salePrice, "salePrice");

      const minSalePrice = isBlank(input.minSalePrice)
        ? null
        : normalizeMoney(input.minSalePrice, "minSalePrice");

      const maxSalePrice = isBlank(input.maxSalePrice)
        ? null
        : normalizeMoney(input.maxSalePrice, "maxSalePrice");

      // ✅ validaciones de rango
      if (minSalePrice && (minSalePrice as any).greaterThan(salePrice as any)) {
        throw new Error("minSalePrice no puede ser mayor que salePrice");
      }
      if (maxSalePrice && (maxSalePrice as any).lessThan(salePrice as any)) {
        throw new Error("maxSalePrice no puede ser menor que salePrice");
      }
      if (
        minSalePrice &&
        maxSalePrice &&
        (minSalePrice as any).greaterThan(maxSalePrice as any)
      ) {
        throw new Error("minSalePrice no puede ser mayor que maxSalePrice");
      }

      const minStock = Math.max(0, normalizeInt(input.minStock, 0));
      const currentStock = Math.max(0, normalizeInt(input.currentStock, 0));

      const active = normalizeBoolean(input.active, true);

      const categoryId = String(input.categoryId ?? "").trim();
      const unitId = String(input.unitId ?? "").trim();
      const supplierId = normalizeText(input.supplierId);

      if (!categoryId) throw new Error("categoryId requerido");
      if (!unitId) throw new Error("unitId requerido");

      const created = await tx.product.create({
  data: {
    code: input.code ?? (await generateProductCode(tx)),
    name: input.name,
    description: input.description ?? null,
    image: input.image ?? null,

    purchasePrice: input.purchasePrice,
    retailPrice: input.retailPrice,
    wholesalePrice: input.wholesalePrice ?? null,
    wholesaleMinQuantity: input.wholesaleMinQuantity ?? 10,

    minSalePrice: input.minSalePrice ?? null,
    maxSalePrice: input.maxSalePrice ?? null,

    minStock: input.minStock ?? 0,
    currentStock: input.currentStock ?? 0,
    reservedStock: input.reservedStock ?? 0,

    active: input.active ?? true,

    categoryId: input.categoryId,
    unitId: input.unitId,
    supplierId: input.supplierId ?? null,
  },
  include: { category: true, supplier: true, unit: true },
});

      return mapProduct(created);
    });
  }

  async update(id: string, input: any): Promise<ProductRecord> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({
      where: { id },
      include: { category: true, supplier: true, unit: true },
    });
    if (!existing) throw new Error("Producto no encontrado");

    const data: Prisma.ProductUpdateInput = {};

    // ===== Textos
    if (input.name !== undefined) {
      const v = String(input.name ?? "").trim();
      if (!v) throw new Error("name inválido");
      data.name = v;
    }
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.image !== undefined) data.image = input.image ?? null;

    // ===== Stocks (rule: reserved <= current)
    const nextCurrent =
      input.currentStock !== undefined ? Number(input.currentStock) : existing.currentStock;

    const nextReserved =
      input.reservedStock !== undefined ? Number(input.reservedStock) : existing.reservedStock;

    if (nextReserved > nextCurrent) {
      throw new Error("reservedStock no puede ser mayor que currentStock");
    }

    if (input.minStock !== undefined) data.minStock = Math.max(0, Number(input.minStock));
    if (input.currentStock !== undefined) data.currentStock = Math.max(0, Number(input.currentStock));
    if (input.reservedStock !== undefined) data.reservedStock = Math.max(0, Number(input.reservedStock));

    // ===== Precios (validación cruzada final)
    const nextRetail =
      input.retailPrice !== undefined ? input.retailPrice : existing.retailPrice;

    const nextWholesale =
      input.wholesalePrice !== undefined ? input.wholesalePrice : (existing.wholesalePrice ?? null);

    const nextMinSale =
      input.minSalePrice !== undefined ? input.minSalePrice : (existing.minSalePrice ?? null);

    const nextMaxSale =
      input.maxSalePrice !== undefined ? input.maxSalePrice : (existing.maxSalePrice ?? null);

    // Reglas: minSale <= retail y <= wholesale (si existe)
    if (nextMinSale && nextMinSale.greaterThan(nextRetail)) {
      throw new Error("minSalePrice no puede ser mayor que retailPrice");
    }
    if (nextMaxSale && nextMaxSale.lessThan(nextRetail)) {
      throw new Error("maxSalePrice no puede ser menor que retailPrice");
    }
    if (nextMinSale && nextMaxSale && nextMinSale.greaterThan(nextMaxSale)) {
      throw new Error("minSalePrice no puede ser mayor que maxSalePrice");
    }

    if (nextWholesale) {
      if (nextMinSale && nextMinSale.greaterThan(nextWholesale)) {
        throw new Error("minSalePrice no puede ser mayor que wholesalePrice");
      }
      if (nextMaxSale && nextMaxSale.lessThan(nextWholesale)) {
        throw new Error("maxSalePrice no puede ser menor que wholesalePrice");
      }
    }

    // Aplicar precios
    if (input.purchasePrice !== undefined) data.purchasePrice = input.purchasePrice;
    if (input.retailPrice !== undefined) data.retailPrice = input.retailPrice;

    if (input.wholesalePrice !== undefined) data.wholesalePrice = input.wholesalePrice; // Decimal|null
    if (input.wholesaleMinQuantity !== undefined) {
      data.wholesaleMinQuantity = Math.max(1, Number(input.wholesaleMinQuantity));
    }

    if (input.minSalePrice !== undefined) data.minSalePrice = input.minSalePrice; // Decimal|null
    if (input.maxSalePrice !== undefined) data.maxSalePrice = input.maxSalePrice; // Decimal|null

    // ===== Relaciones
    if (input.categoryId !== undefined) {
      const v = String(input.categoryId ?? "").trim();
      if (!v) throw new Error("categoryId inválido");
      data.category = { connect: { id: v } };
    }

    if (input.unitId !== undefined) {
      const v = String(input.unitId ?? "").trim();
      if (!v) throw new Error("unitId inválido");
      data.unit = { connect: { id: v } };
    }

    if (input.supplierId !== undefined) {
      const v = input.supplierId; // string|null (ya normalizado)
      data.supplier = v ? { connect: { id: v } } : { disconnect: true };
    }

    // (opcional) si permites cambiar code manual:
    if (input.code !== undefined) {
      const v = String(input.code ?? "").trim();
      if (!v) throw new Error("code inválido");
      data.code = v;
    }

    const updated = await tx.product.update({
      where: { id },
      data,
      include: { category: true, supplier: true, unit: true },
    });

    return mapProduct(updated);
  });
}

  async delete(id: string): Promise<void> {
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return;

    await prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }
}
