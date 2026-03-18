// src/modules/products/domain/product.rules.ts
import { isProductStatus, ProductStatus } from "./product-status";

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

export function normalizeInt(v: unknown, defaultValue = 0): number {
  if (v === undefined || v === null || toStr(v) === "") return defaultValue;
  const n = Number(v);
  if (!Number.isFinite(n)) return defaultValue;
  return Math.trunc(n);
}

export function normalizeProductStatus(
  v: unknown,
  defaultValue: ProductStatus = "ACTIVE"
): ProductStatus {
  const s = toStr(v).toUpperCase();
  if (!s) return defaultValue;
  if (isProductStatus(s)) return s;
  throw new Error("status inválido");
}

export function normalizeMoney(v: unknown, fieldName: string): string {
  const s = toStr(v);
  if (!s) throw new Error(`${fieldName} requerido`);

  const cleaned = s.replace(",", ".");
  const n = Number(cleaned);

  if (!Number.isFinite(n)) throw new Error(`${fieldName} inválido`);
  if (n < 0) throw new Error(`${fieldName} no puede ser negativo`);

  return cleaned;
}

function isBlank(v: unknown) {
  return v === undefined || v === null || toStr(v) === "";
}

type CreateProductLike = {
  code?: unknown;
  name: unknown;
  description?: unknown;
  image?: unknown;

  purchasePrice: unknown;
  retailPrice: unknown;

  wholesalePrice?: unknown;
  wholesaleMinQuantity?: unknown;

  minSalePrice?: unknown;
  maxSalePrice?: unknown;

  minStock?: unknown;
  currentStock?: unknown;
  reservedStock?: unknown;

  status?: unknown;

  categoryId: unknown;
  supplierId?: unknown;
  unitId: unknown;
};

export function normalizeCreateProduct(input: CreateProductLike) {
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

  const supplierId = normalizeText(input.supplierId) ?? null;
  const description = normalizeText(input.description);
  const image = normalizeText(input.image);
  const code = normalizeText(input.code);

  return {
    code,
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
    status,
    categoryId,
    supplierId,
    unitId,
  };
}

export function normalizeUpdateProduct(dto: Record<string, unknown>) {
  const out: Record<string, unknown> = {};

  if (dto.name !== undefined) {
    const v = toStr(dto.name);
    if (!v) throw new Error("name inválido");
    out.name = v;
  }

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

  if (dto.status !== undefined) out.status = normalizeProductStatus(dto.status);

  if (dto.categoryId !== undefined) out.categoryId = toStr(dto.categoryId);
  if (dto.unitId !== undefined) out.unitId = toStr(dto.unitId);
  if (dto.supplierId !== undefined) out.supplierId = normalizeText(dto.supplierId) ?? null;
  if (dto.code !== undefined) out.code = toStr(dto.code);

  if (out.currentStock !== undefined && out.reservedStock !== undefined) {
    if (Number(out.reservedStock) > Number(out.currentStock)) {
      throw new Error("reservedStock no puede ser mayor que currentStock");
    }
  }

  return out;
}