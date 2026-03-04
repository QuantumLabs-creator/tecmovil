// src/modules/products/domain/product.rules.ts

import { Prisma } from "@/src/generated/prisma/client";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

export function normalizeBoolean(v: unknown, defaultValue = true): boolean {
  if (v === undefined || v === null || toStr(v) === "") return defaultValue;
  const s = toStr(v).toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "si") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return defaultValue;
}

export function normalizeInt(v: unknown, defaultValue = 0): number {
  if (v === undefined || v === null || toStr(v) === "") return defaultValue;
  const n = Number(v);
  if (!Number.isFinite(n)) return defaultValue;
  return Math.trunc(n);
}

export function normalizeMoney(v: unknown, fieldName: string): Prisma.Decimal {
  const s = toStr(v);
  if (!s) throw new Error(`${fieldName} requerido`);

  const cleaned = s.replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(`${fieldName} inválido`);
  if (n < 0) throw new Error(`${fieldName} no puede ser negativo`);

  return new (Prisma.Decimal as any)(cleaned) as Prisma.Decimal;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || toStr(v) === "";
}

export function normalizeCreateProduct(input: any) {
  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  const categoryId = toStr(input.categoryId);
  if (!categoryId) throw new Error("categoryId requerido");

  const unitId = toStr(input.unitId);
  if (!unitId) throw new Error("unitId requerido");

  const purchasePrice = normalizeMoney(input.purchasePrice, "purchasePrice");
  const retailPrice = normalizeMoney(input.retailPrice, "retailPrice");

  const wholesalePrice = isBlank(input.wholesalePrice)
    ? null
    : normalizeMoney(input.wholesalePrice, "wholesalePrice");

  const wholesaleMinQuantity = Math.max(1, normalizeInt(input.wholesaleMinQuantity, 10));

  const minSalePrice = isBlank(input.minSalePrice) ? null : normalizeMoney(input.minSalePrice, "minSalePrice");
  const maxSalePrice = isBlank(input.maxSalePrice) ? null : normalizeMoney(input.maxSalePrice, "maxSalePrice");

  // reglas de rango (sobre retailPrice como referencia)
  if (minSalePrice && minSalePrice.greaterThan(retailPrice)) {
    throw new Error("minSalePrice no puede ser mayor que retailPrice");
  }
  if (maxSalePrice && maxSalePrice.lessThan(retailPrice)) {
    throw new Error("maxSalePrice no puede ser menor que retailPrice");
  }
  if (minSalePrice && maxSalePrice && minSalePrice.greaterThan(maxSalePrice)) {
    throw new Error("minSalePrice no puede ser mayor que maxSalePrice");
  }

  // si hay wholesalePrice, también valida contra límites si existen
  if (wholesalePrice) {
    if (minSalePrice && minSalePrice.greaterThan(wholesalePrice)) {
      throw new Error("minSalePrice no puede ser mayor que wholesalePrice");
    }
    if (maxSalePrice && maxSalePrice.lessThan(wholesalePrice)) {
      throw new Error("maxSalePrice no puede ser menor que wholesalePrice");
    }
  }

  const minStock = Math.max(0, normalizeInt(input.minStock, 0));
  const currentStock = Math.max(0, normalizeInt(input.currentStock, 0));
  const reservedStock = Math.max(0, normalizeInt(input.reservedStock, 0));
  if (reservedStock > currentStock) throw new Error("reservedStock no puede ser mayor que currentStock");

  const active = normalizeBoolean(input.active, true);

  const supplierId = normalizeText(input.supplierId) ?? null;
  const description = normalizeText(input.description);
  const image = normalizeText(input.image);

  const code = normalizeText(input.code); // opcional, si lo mandas debe venir limpio

  return {
    code, // string | null
    name,
    description,
    image,
    purchasePrice,
    retailPrice,
    wholesalePrice,
    wholesaleMinQuantity,
    minSalePrice,
    maxSalePrice,
    minStock,
    currentStock,
    reservedStock,
    active,
    categoryId,
    supplierId,
    unitId,
  };
}

export function normalizeUpdateProduct(dto: any) {
  const out: any = {};

  if (dto.name !== undefined) out.name = toStr(dto.name);
  if (dto.description !== undefined) out.description = normalizeText(dto.description);
  if (dto.image !== undefined) out.image = normalizeText(dto.image);

  if (dto.purchasePrice !== undefined) out.purchasePrice = normalizeMoney(dto.purchasePrice, "purchasePrice");
  if (dto.retailPrice !== undefined) out.retailPrice = normalizeMoney(dto.retailPrice, "retailPrice");

  if (dto.wholesalePrice !== undefined) {
    out.wholesalePrice = isBlank(dto.wholesalePrice) ? null : normalizeMoney(dto.wholesalePrice, "wholesalePrice");
  }
  if (dto.wholesaleMinQuantity !== undefined) {
    out.wholesaleMinQuantity = Math.max(1, normalizeInt(dto.wholesaleMinQuantity, 10));
  }

  if (dto.minSalePrice !== undefined) {
    out.minSalePrice = isBlank(dto.minSalePrice) ? null : normalizeMoney(dto.minSalePrice, "minSalePrice");
  }
  if (dto.maxSalePrice !== undefined) {
    out.maxSalePrice = isBlank(dto.maxSalePrice) ? null : normalizeMoney(dto.maxSalePrice, "maxSalePrice");
  }

  if (dto.minStock !== undefined) out.minStock = Math.max(0, normalizeInt(dto.minStock, 0));
  if (dto.currentStock !== undefined) out.currentStock = Math.max(0, normalizeInt(dto.currentStock, 0));
  if (dto.reservedStock !== undefined) out.reservedStock = Math.max(0, normalizeInt(dto.reservedStock, 0));

  if (dto.active !== undefined) out.active = normalizeBoolean(dto.active, true);

  if (dto.categoryId !== undefined) out.categoryId = toStr(dto.categoryId);
  if (dto.unitId !== undefined) out.unitId = toStr(dto.unitId);
  if (dto.supplierId !== undefined) out.supplierId = normalizeText(dto.supplierId) ?? null;

  if (dto.code !== undefined) out.code = toStr(dto.code);

  // regla final si ambos vienen
  if (out.currentStock !== undefined && out.reservedStock !== undefined) {
    if (out.reservedStock > out.currentStock) throw new Error("reservedStock no puede ser mayor que currentStock");
  }

  return out;
}
