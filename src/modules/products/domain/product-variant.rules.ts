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

function toBooleanDefault(v: unknown, fallback = true) {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
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
  active?: unknown;
}) {
  return {
    productId: String(input.productId ?? "").trim(),
    color: toNullableText(input.color),
    size: toNullableText(input.size),
    sku: toNullableText(input.sku),
    retailPrice: toMoneyOrNull(input.retailPrice),
    currentStock: toNonNegativeInt(input.currentStock, 0),
    reservedStock: toNonNegativeInt(input.reservedStock, 0),
    active: toBooleanDefault(input.active, true),
  };
}

export function normalizeUpdateVariant(input: {
  color?: unknown;
  size?: unknown;
  sku?: unknown;
  retailPrice?: unknown;
  currentStock?: unknown;
  reservedStock?: unknown;
  active?: unknown;
}) {
  const out: Record<string, unknown> = {};

  if ("color" in input) out.color = toNullableText(input.color);
  if ("size" in input) out.size = toNullableText(input.size);
  if ("sku" in input) out.sku = toNullableText(input.sku);
  if ("retailPrice" in input) out.retailPrice = toMoneyOrNull(input.retailPrice);
  if ("currentStock" in input) out.currentStock = toNonNegativeInt(input.currentStock, 0);
  if ("reservedStock" in input) out.reservedStock = toNonNegativeInt(input.reservedStock, 0);
  if ("active" in input) out.active = toBooleanDefault(input.active, true);

  return out;
}