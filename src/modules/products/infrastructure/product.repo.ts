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
  p: Prisma.ProductGetPayload<{
    include: { category: true; supplier: true; unit: true };
  }>
): ProductRecord {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description ?? null,

    purchasePrice: p.purchasePrice,
    salePrice: p.salePrice,

    minSalePrice: p.minSalePrice ?? null,
    maxSalePrice: p.maxSalePrice ?? null,

    minStock: p.minStock,
    currentStock: p.currentStock,

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
          code,
          name,
          description: description ?? null,
          purchasePrice,
          salePrice,
          minSalePrice,
          maxSalePrice,
          minStock,
          currentStock,
          active,
          categoryId,
          unitId,
          supplierId: supplierId ?? null,
        },
        include: { category: true, supplier: true, unit: true },
      });

      return mapProduct(created);
    });
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) throw new Error("Producto no encontrado");

      const data: Prisma.ProductUpdateInput = {};

      // ===== Campos simples
      if (input.name !== undefined) {
        const v = normalizeText(input.name);
        if (!v) throw new Error("name inválido");
        data.name = v;
      }

      if (input.description !== undefined) {
        data.description = normalizeText(input.description) ?? null;
      }

      // ===== Precios (para validación cruzada)
      const nextSalePrice =
        input.salePrice !== undefined
          ? normalizeMoney(input.salePrice, "salePrice")
          : existing.salePrice;

      const nextMinSale =
        input.minSalePrice !== undefined
          ? isBlank(input.minSalePrice)
            ? null
            : normalizeMoney(input.minSalePrice, "minSalePrice")
          : existing.minSalePrice ?? null;

      const nextMaxSale =
        input.maxSalePrice !== undefined
          ? isBlank(input.maxSalePrice)
            ? null
            : normalizeMoney(input.maxSalePrice, "maxSalePrice")
          : existing.maxSalePrice ?? null;

      // ✅ validaciones de rango con valores finales
      if (nextMinSale && (nextMinSale as any).greaterThan(nextSalePrice as any)) {
        throw new Error("minSalePrice no puede ser mayor que salePrice");
      }
      if (nextMaxSale && (nextMaxSale as any).lessThan(nextSalePrice as any)) {
        throw new Error("maxSalePrice no puede ser menor que salePrice");
      }
      if (nextMinSale && nextMaxSale && (nextMinSale as any).greaterThan(nextMaxSale as any)) {
        throw new Error("minSalePrice no puede ser mayor que maxSalePrice");
      }

      if (input.purchasePrice !== undefined) {
        data.purchasePrice = normalizeMoney(input.purchasePrice, "purchasePrice");
      }

      if (input.salePrice !== undefined) {
        data.salePrice = nextSalePrice;
      }

      // ✅ aplicar min/max si vienen
      if (input.minSalePrice !== undefined) data.minSalePrice = nextMinSale;
      if (input.maxSalePrice !== undefined) data.maxSalePrice = nextMaxSale;

      if (input.minStock !== undefined) {
        data.minStock = Math.max(0, normalizeInt(input.minStock, 0));
      }

      if (input.currentStock !== undefined) {
        data.currentStock = Math.max(0, normalizeInt(input.currentStock, 0));
      }

      if (input.active !== undefined) {
        data.active = normalizeBoolean(input.active, true);
      }

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
        const v = normalizeText(input.supplierId);
        data.supplier = v ? { connect: { id: v } } : { disconnect: true };
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
