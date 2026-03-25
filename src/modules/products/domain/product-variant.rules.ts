import type { ProductStatus } from "./product-status";

function toNullableText(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function toNonNegativeInt(v: unknown, fallback = 0) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) return fallback;
  return n;
}

function toMoneyOrNull(v: unknown) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error("Monto inválido");
  return n.toFixed(2);
}

function toStatus(v: unknown, fallback: ProductStatus = "ACTIVE"): ProductStatus {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "ACTIVE" || s === "INACTIVE" || s === "ARCHIVED") {
    return s as ProductStatus;
  }
  return fallback;
}

export function normalizeCreateVariant(input: {
  productId: unknown;
  color?: unknown;
  size?: unknown;
  sku?: unknown;
  retailPrice?: unknown;
  currentStock?: unknown;
  reservedStock?: unknown;
  status?: unknown;
}) {
  return {
    productId: String(input.productId ?? "").trim(),
    color: toNullableText(input.color),
    size: toNullableText(input.size),
    sku: toNullableText(input.sku),
    retailPrice: toMoneyOrNull(input.retailPrice),
    currentStock: toNonNegativeInt(input.currentStock, 0),
    reservedStock: toNonNegativeInt(input.reservedStock, 0),
    status: toStatus(input.status, "ACTIVE"),
  };
}

export function normalizeUpdateVariant(input: {
  color?: unknown;
  size?: unknown;
  sku?: unknown;
  retailPrice?: unknown;
  currentStock?: unknown;
  reservedStock?: unknown;
  status?: unknown;
}) {
  const out: Record<string, unknown> = {};

  if ("color" in input) out.color = toNullableText(input.color);
  if ("size" in input) out.size = toNullableText(input.size);
  if ("sku" in input) out.sku = toNullableText(input.sku);
  if ("retailPrice" in input) out.retailPrice = toMoneyOrNull(input.retailPrice);
  if ("currentStock" in input) out.currentStock = toNonNegativeInt(input.currentStock, 0);
  if ("reservedStock" in input) out.reservedStock = toNonNegativeInt(input.reservedStock, 0);
  if ("status" in input) out.status = toStatus(input.status, "ACTIVE");

  return out;
}