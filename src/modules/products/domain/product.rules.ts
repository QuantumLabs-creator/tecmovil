// src/modules/products/domain/product.rules.ts
import { Prisma } from "@/src/generated/prisma/client";
import type { CreateProductInput, UpdateProductInput } from "./product.repository";

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

  // acepta: "12", "12.5", "12,50"
  const cleaned = s.replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(`${fieldName} inválido`);

  // Prisma.Decimal puede construirse desde string/number
  return new (Prisma.Decimal as any)(cleaned) as Prisma.Decimal;
}

export function assertCreateProductInput(input: unknown): asserts input is CreateProductInput {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as any;

  if (!toStr(x.name)) throw new Error("name requerido");
  if (!toStr(x.categoryId)) throw new Error("categoryId requerido");
  if (!toStr(x.unitId)) throw new Error("unitId requerido");

  // precios obligatorios
  if (x.purchasePrice === undefined || toStr(x.purchasePrice) === "")
    throw new Error("purchasePrice requerido");
  if (x.salePrice === undefined || toStr(x.salePrice) === "")
    throw new Error("salePrice requerido");
}

export function normalizeCreateProduct(input: CreateProductInput) {

  const name = toStr(input.name);
  if (!name) throw new Error("name requerido");

  const categoryId = toStr(input.categoryId);
  if (!categoryId) throw new Error("categoryId requerido");

  const unitId = toStr(input.unitId);
  if (!unitId) throw new Error("unitId requerido");

  const supplierId = normalizeText(input.supplierId) ?? null;

  const purchasePrice = normalizeMoney(input.purchasePrice, "purchasePrice");
  const salePrice = normalizeMoney(input.salePrice, "salePrice");

  const minStock = Math.max(0, normalizeInt(input.minStock, 0));
  const currentStock = Math.max(0, normalizeInt(input.currentStock, 0));

  const active = normalizeBoolean(input.active, true);
  const minSalePrice =
    input.minSalePrice !== undefined && String(input.minSalePrice ?? "").trim() !== ""
      ? normalizeMoney(input.minSalePrice, "minSalePrice")
      : null;

  const maxSalePrice =
    input.maxSalePrice !== undefined && String(input.maxSalePrice ?? "").trim() !== ""
      ? normalizeMoney(input.maxSalePrice, "maxSalePrice")
      : null;

  // ✅ validaciones de rango
  if (minSalePrice && minSalePrice.greaterThan(salePrice)) {
    throw new Error("minSalePrice no puede ser mayor que salePrice");
  }
  if (maxSalePrice && maxSalePrice.lessThan(salePrice)) {
    throw new Error("maxSalePrice no puede ser menor que salePrice");
  }
  if (minSalePrice && maxSalePrice && minSalePrice.greaterThan(maxSalePrice)) {
    throw new Error("minSalePrice no puede ser mayor que maxSalePrice");
  }

  return {

    name,
    description: normalizeText(input.description),
    purchasePrice,
    salePrice,
    minStock,
    currentStock,
    active,
    categoryId,
    supplierId,
    unitId,
    minSalePrice,
    maxSalePrice,
  };
}

export function normalizeUpdateProduct(dto: Partial<CreateProductInput>): UpdateProductInput {
  const out: UpdateProductInput = {};

  if (dto.name !== undefined) out.name = toStr(dto.name);
  if (dto.description !== undefined) out.description = normalizeText(dto.description);

  if (dto.purchasePrice !== undefined) out.purchasePrice = normalizeMoney(dto.purchasePrice, "purchasePrice");
  if (dto.salePrice !== undefined) out.salePrice = normalizeMoney(dto.salePrice, "salePrice");

  if (dto.minStock !== undefined) out.minStock = Math.max(0, normalizeInt(dto.minStock, 0));
  if (dto.currentStock !== undefined) out.currentStock = Math.max(0, normalizeInt(dto.currentStock, 0));

  if (dto.active !== undefined) out.active = normalizeBoolean(dto.active, true);

  if (dto.categoryId !== undefined) out.categoryId = toStr(dto.categoryId);
  if (dto.supplierId !== undefined) out.supplierId = normalizeText(dto.supplierId) ?? null;
  if (dto.unitId !== undefined) out.unitId = toStr(dto.unitId);

  if (dto.minSalePrice !== undefined) {
    out.minSalePrice =
      String(dto.minSalePrice ?? "").trim() === ""
        ? null
        : normalizeMoney(dto.minSalePrice, "minSalePrice");
  }

  if (dto.maxSalePrice !== undefined) {
    out.maxSalePrice =
      String(dto.maxSalePrice ?? "").trim() === ""
        ? null
        : normalizeMoney(dto.maxSalePrice, "maxSalePrice");
  }

  return out;
}
