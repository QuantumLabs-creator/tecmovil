// src/modules/products/infrastructure/product.repo.ts
import { prisma } from "@/src/shared/db/prisma";
import { Prisma } from "@/src/generated/prisma/client";
import type { Prisma as PrismaTypes } from "@/src/generated/prisma/client";

import type {
  ProductRepository,
  ProductRecord,
  ProductListParams,
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
  ProductVariantRecord,
} from "../domain/product.repository";

import {
  normalizeText,
  normalizeInt,
  normalizeMoney,
  normalizeProductStatus,
} from "../domain/product.rules";
import { isProductStatus, type ProductStatus } from "../domain/product-status";
import { ProductVariantEntity } from "../domain/product-variant.entity";

/** ===================== Helpers ===================== */

async function generateProductCode(tx: PrismaTypes.TransactionClient) {
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

function toDecimal(value: string | null): Prisma.Decimal | null {
  if (value === null) return null;
  return new Prisma.Decimal(value);
}

function mapVariant(
  v: {
    id: string;
    productId: string;
    color: string | null;
    size: string | null;
    sku: string | null;
    retailPrice: Prisma.Decimal | null;
    currentStock: number;
    reservedStock: number;
    status: ProductStatus;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
): ProductVariantRecord {
  return {
    id: v.id,
    productId: v.productId,
    color: v.color ?? null,
    size: v.size ?? null,
    sku: v.sku ?? null,
    retailPrice: v.retailPrice?.toString() ?? null,
    currentStock: v.currentStock,
    reservedStock: v.reservedStock,
    status: v.status as ProductStatus,
    archivedAt: v.archivedAt ?? null,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

function mapProduct(
  p: PrismaTypes.ProductGetPayload<{ include: { category: true; supplier: true; unit: true } }>,
  pendingRequestedStock = 0
): ProductRecord {
  const availableRealStock = Math.max(0, p.currentStock - p.reservedStock);
  const availableCommercialStock = Math.max(
    0,
    p.currentStock - p.reservedStock - pendingRequestedStock
  );

  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description ?? null,
    image: p.image ?? null,

    purchasePrice: p.purchasePrice.toString(),
    retailPrice: p.retailPrice.toString(),
    wholesalePrice: p.wholesalePrice?.toString() ?? null,
    wholesaleMinQuantity: p.wholesaleMinQuantity,

    minSalePrice: p.minSalePrice?.toString() ?? null,
    maxSalePrice: p.maxSalePrice?.toString() ?? null,

    minStock: p.minStock,
    currentStock: p.currentStock,
    reservedStock: p.reservedStock,

    hasVariants: p.hasVariants,

    pendingRequestedStock,
    availableRealStock,
    availableCommercialStock,

    status: p.status as ProductStatus,
    archivedAt: p.archivedAt ?? null,
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

function parseStatusFilter(v?: string): ProductStatus | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;

  const s = String(v).trim().toUpperCase();
  if (!isProductStatus(s)) throw new Error("status inválido");
  if (s === "ARCHIVED") throw new Error("No se permite buscar productos archivados");

  return s;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

async function getPendingRequestedMap(
  productIds: string[]
): Promise<Map<string, number>> {
  if (!productIds.length) return new Map();

  const rows = await prisma.saleOrderDetail.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: {
        status: "PENDING_REQUEST",
      },
    },
    _sum: {
      quantity: true,
    },
  });

  return new Map(
    rows.map((r) => [r.productId, Number(r._sum.quantity ?? 0)])
  );
}

/** ===================== Repository ===================== */

export class PrismaProductRepository implements ProductRepository {
  async getById(id: string): Promise<ProductRecord | null> {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true, unit: true },
    });

    if (!p) return null;

    const pendingMap = await getPendingRequestedMap([p.id]);
    return mapProduct(p, pendingMap.get(p.id) ?? 0);
  }

  async getByCode(code: string): Promise<ProductRecord | null> {
    const c = String(code ?? "").trim();
    if (!c) return null;

    const p = await prisma.product.findUnique({
      where: { code: c },
      include: { category: true, supplier: true, unit: true },
    });

    if (!p) return null;

    const pendingMap = await getPendingRequestedMap([p.id]);
    return mapProduct(p, pendingMap.get(p.id) ?? 0);
  }

  async list(params: ProductListParams): Promise<ProductListResult> {
    const q = String(params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: PrismaTypes.ProductWhereInput = {};

    const status = parseStatusFilter(params.status as string | undefined);
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["ACTIVE", "INACTIVE"] };
    }

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

    const pendingMap = await getPendingRequestedMap(items.map((p) => p.id));

    let mapped = items.map((p) => mapProduct(p, pendingMap.get(p.id) ?? 0));

    if (params.lowStock === true) {
      mapped = mapped.filter((p) => p.availableCommercialStock <= p.minStock);
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
      const code = String(input.code ?? "").trim() || (await generateProductCode(tx));

      const name = normalizeText(input.name);
      if (!name) throw new Error("name requerido");

      const categoryId = String(input.categoryId ?? "").trim();
      const unitId = String(input.unitId ?? "").trim();
      if (!categoryId) throw new Error("categoryId requerido");
      if (!unitId) throw new Error("unitId requerido");

      const purchasePrice = normalizeMoney(input.purchasePrice, "purchasePrice");
      const retailPrice = normalizeMoney(input.retailPrice, "retailPrice");

      const wholesalePrice = isBlank(input.wholesalePrice)
        ? null
        : normalizeMoney(input.wholesalePrice, "wholesalePrice");

      const wholesaleMinQuantity =
        input.wholesaleMinQuantity === undefined
          ? 10
          : Math.max(1, normalizeInt(input.wholesaleMinQuantity, 10));

      const minSalePrice = isBlank(input.minSalePrice)
        ? null
        : normalizeMoney(input.minSalePrice, "minSalePrice");

      const maxSalePrice = isBlank(input.maxSalePrice)
        ? null
        : normalizeMoney(input.maxSalePrice, "maxSalePrice");

      if (minSalePrice && Number(minSalePrice) > Number(retailPrice)) {
        throw new Error("minSalePrice no puede ser mayor que retailPrice");
      }
      if (maxSalePrice && Number(maxSalePrice) < Number(retailPrice)) {
        throw new Error("maxSalePrice no puede ser menor que retailPrice");
      }
      if (minSalePrice && maxSalePrice && Number(minSalePrice) > Number(maxSalePrice)) {
        throw new Error("minSalePrice no puede ser mayor que maxSalePrice");
      }

      if (wholesalePrice) {
        if (minSalePrice && Number(minSalePrice) > Number(wholesalePrice)) {
          throw new Error("minSalePrice no puede ser mayor que wholesalePrice");
        }
        if (maxSalePrice && Number(maxSalePrice) < Number(wholesalePrice)) {
          throw new Error("maxSalePrice no puede ser menor que wholesalePrice");
        }
      }

      const minStock = Math.max(0, normalizeInt(input.minStock, 0));
      const currentStock = Math.max(0, normalizeInt(input.currentStock, 0));
      const reservedStock = Math.max(0, normalizeInt(input.reservedStock, 0));

      if (reservedStock > currentStock) {
        throw new Error("reservedStock no puede ser mayor que currentStock");
      }

      const status = normalizeProductStatus(input.status, "ACTIVE");
      const hasVariants = input.hasVariants === true || input.hasVariants === "true";

      const created = await tx.product.create({
        data: {
          code,
          name,
          description: normalizeText(input.description) ?? null,
          image: normalizeText(input.image) ?? null,

          purchasePrice: new Prisma.Decimal(purchasePrice),
          retailPrice: new Prisma.Decimal(retailPrice),
          wholesalePrice: toDecimal(wholesalePrice),
          wholesaleMinQuantity,

          minSalePrice: toDecimal(minSalePrice),
          maxSalePrice: toDecimal(maxSalePrice),

          minStock,
          currentStock,
          reservedStock,

          hasVariants,

          status,
          archivedAt: status === "ARCHIVED" ? new Date() : null,

          categoryId,
          unitId,
          supplierId: normalizeText(input.supplierId) ?? null,
        },
        include: { category: true, supplier: true, unit: true },
      });

      return mapProduct(created);
    });
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductRecord> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id },
        include: { category: true, supplier: true, unit: true },
      });
      if (!existing) throw new Error("Producto no encontrado");

      const data: PrismaTypes.ProductUpdateInput = {};

      if (input.name !== undefined) {
        const v = String(input.name ?? "").trim();
        if (!v) throw new Error("name inválido");
        data.name = v;
      }
      if (input.description !== undefined) data.description = normalizeText(input.description) ?? null;
      if (input.image !== undefined) data.image = normalizeText(input.image) ?? null;

      const nextCurrent =
        input.currentStock !== undefined
          ? Math.max(0, Number(input.currentStock))
          : existing.currentStock;

      const nextReserved =
        input.reservedStock !== undefined
          ? Math.max(0, Number(input.reservedStock))
          : existing.reservedStock;

      if (nextReserved > nextCurrent) {
        throw new Error("reservedStock no puede ser mayor que currentStock");
      }

      if (input.minStock !== undefined) data.minStock = Math.max(0, Number(input.minStock));
      if (input.currentStock !== undefined) data.currentStock = Math.max(0, Number(input.currentStock));
      if (input.reservedStock !== undefined) data.reservedStock = Math.max(0, Number(input.reservedStock));

      const nextRetail =
        input.retailPrice !== undefined
          ? new Prisma.Decimal(normalizeMoney(input.retailPrice, "retailPrice"))
          : existing.retailPrice;

      const nextWholesale =
        input.wholesalePrice !== undefined
          ? (isBlank(input.wholesalePrice)
            ? null
            : new Prisma.Decimal(normalizeMoney(input.wholesalePrice, "wholesalePrice")))
          : (existing.wholesalePrice ?? null);

      const nextMinSale =
        input.minSalePrice !== undefined
          ? (isBlank(input.minSalePrice)
            ? null
            : new Prisma.Decimal(normalizeMoney(input.minSalePrice, "minSalePrice")))
          : (existing.minSalePrice ?? null);

      const nextMaxSale =
        input.maxSalePrice !== undefined
          ? (isBlank(input.maxSalePrice)
            ? null
            : new Prisma.Decimal(normalizeMoney(input.maxSalePrice, "maxSalePrice")))
          : (existing.maxSalePrice ?? null);

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

      if (input.purchasePrice !== undefined) {
        data.purchasePrice = new Prisma.Decimal(normalizeMoney(input.purchasePrice, "purchasePrice"));
      }
      if (input.retailPrice !== undefined) {
        data.retailPrice = new Prisma.Decimal(normalizeMoney(input.retailPrice, "retailPrice"));
      }

      if (input.wholesalePrice !== undefined) {
        data.wholesalePrice = isBlank(input.wholesalePrice)
          ? null
          : new Prisma.Decimal(normalizeMoney(input.wholesalePrice, "wholesalePrice"));
      }

      if (input.wholesaleMinQuantity !== undefined) {
        data.wholesaleMinQuantity = Math.max(1, Number(input.wholesaleMinQuantity));
      }

      if (input.minSalePrice !== undefined) {
        data.minSalePrice = isBlank(input.minSalePrice)
          ? null
          : new Prisma.Decimal(normalizeMoney(input.minSalePrice, "minSalePrice"));
      }

      if (input.maxSalePrice !== undefined) {
        data.maxSalePrice = isBlank(input.maxSalePrice)
          ? null
          : new Prisma.Decimal(normalizeMoney(input.maxSalePrice, "maxSalePrice"));
      }

      if (input.status !== undefined) {
        const status = normalizeProductStatus(input.status);
        data.status = status;
        data.archivedAt = status === "ARCHIVED" ? new Date() : null;
      }

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

      if (input.code !== undefined) {
        const v = String(input.code ?? "").trim();
        if (!v) throw new Error("code inválido");
        data.code = v;
      }

      if (input.hasVariants !== undefined) {
        data.hasVariants = input.hasVariants === true || input.hasVariants === "true";
      }

      const updated = await tx.product.update({
        where: { id },
        data,
        include: { category: true, supplier: true, unit: true },
      });

      return mapProduct(updated);
    });
  }

  async archive(id: string): Promise<void> {
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return;

    if (p.status === "ARCHIVED") return;

    await prisma.product.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }
  async existsById(id: string) {
    const count = await prisma.product.count({
      where: { id },
    });
    return count > 0;
  }

  async listVariants(productId: string, status?: ProductStatus): Promise<ProductVariantRecord[]> {
    const rows = await prisma.productVariant.findMany({
      where: {
        productId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ color: "asc" }, { size: "asc" }, { createdAt: "asc" }],
    });

    return rows.map((row) => mapVariant(row as any));
  }

  async getVariantById(id: string): Promise<ProductVariantRecord | null> {
    const row = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!row) return null;

    return mapVariant({
      ...row,
      status: row.status as ProductStatus,
    });
  }

  async existsVariantDuplicate(params: {
    productId: string;
    color?: string | null;
    size?: string | null;
    excludeId?: string;
  }) {
    const found = await prisma.productVariant.findFirst({
      where: {
        productId: params.productId,
        color: params.color ?? null,
        size: params.size ?? null,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
      select: { id: true },
    });

    return !!found;
  }

  async createVariant(entity: ProductVariantEntity): Promise<ProductVariantRecord> {
    const p = entity.props;

    const row = await prisma.productVariant.create({
      data: {
        productId: p.productId,
        color: p.color ?? null,
        size: p.size ?? null,
        sku: p.sku ?? null,
        retailPrice:
          p.retailPrice != null ? new Prisma.Decimal(p.retailPrice) : null,
        currentStock: p.currentStock,
        reservedStock: p.reservedStock,
        status: p.status as ProductStatus,
        archivedAt: p.status === "ARCHIVED" ? new Date() : null,
      },
    });

    return mapVariant({
      ...row,
      status: row.status as ProductStatus,
    });
  }

  async updateVariant(
    id: string,
    data: Partial<ProductVariantEntity["props"]>
  ): Promise<ProductVariantRecord> {
    const row = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(data.color !== undefined ? { color: data.color ?? null } : {}),
        ...(data.size !== undefined ? { size: data.size ?? null } : {}),
        ...(data.sku !== undefined ? { sku: data.sku ?? null } : {}),
        ...(data.retailPrice !== undefined
          ? {
            retailPrice:
              data.retailPrice != null
                ? new Prisma.Decimal(data.retailPrice)
                : null,
          }
          : {}),
        ...(data.currentStock !== undefined
          ? { currentStock: data.currentStock }
          : {}),
        ...(data.reservedStock !== undefined
          ? { reservedStock: data.reservedStock }
          : {}),
        ...(data.status !== undefined
          ? {
            status: data.status as ProductStatus,
            archivedAt: data.status === "ARCHIVED" ? new Date() : null,
          }
          : {}),
      },
    });

    return mapVariant({
      ...row,
      status: row.status as ProductStatus,
    });
  }

  async deleteVariant(id: string) {
    await prisma.productVariant.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }
}