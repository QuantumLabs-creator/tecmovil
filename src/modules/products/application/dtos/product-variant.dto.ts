function toStr(v: unknown) {
  return String(v ?? "").trim();
}

function toNullableStr(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function toInt(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isInteger(n) ? n : fallback;
}

function toStatus(v: unknown, fallback = "ACTIVE") {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "ACTIVE" || s === "INACTIVE" || s === "ARCHIVED") return s;
  return fallback;
}

export type ProductVariantDTO = {
  id: string;
  productId: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  retailPrice: string | null;
  currentStock: number;
  reservedStock: number;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductVariantDTO = {
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  retailPrice?: string | number | null;
  currentStock?: number;
  reservedStock?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
};

export type UpdateProductVariantDTO = Partial<CreateProductVariantDTO>;

export type VariantQueryDTO = {
  status?: string;
};

export function assertCreateProductVariantDTO(
  input: unknown,
): asserts input is CreateProductVariantDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");
  const x = input as Record<string, unknown>;

  const color = toNullableStr(x.color);
  const size = toNullableStr(x.size);

  if (!color && !size) {
    throw new Error("La variante debe tener al menos color o talla");
  }

  const currentStock =
    x.currentStock == null ? 0 : toInt(x.currentStock, NaN as never);
  const reservedStock =
    x.reservedStock == null ? 0 : toInt(x.reservedStock, NaN as never);

  if (!Number.isInteger(currentStock) || currentStock < 0) {
    throw new Error("currentStock inválido");
  }

  if (!Number.isInteger(reservedStock) || reservedStock < 0) {
    throw new Error("reservedStock inválido");
  }

  if (reservedStock > currentStock) {
    throw new Error("reservedStock no puede ser mayor que currentStock");
  }

  if (x.retailPrice != null && x.retailPrice !== "") {
    const price = Number(x.retailPrice);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("retailPrice inválido");
    }
  }

  if ("status" in x && x.status != null && x.status !== "") {
    const status = toStatus(x.status, "__INVALID__");
    if (status === "__INVALID__") {
      throw new Error("status inválido");
    }
  }
}

export function assertUpdateProductVariantDTO(
  input: unknown,
): asserts input is UpdateProductVariantDTO {
  if (!input || typeof input !== "object") throw new Error("Body inválido");

  const x = input as Record<string, unknown>;

  if ("currentStock" in x) {
    const currentStock = toInt(x.currentStock, NaN as never);
    if (!Number.isInteger(currentStock) || currentStock < 0) {
      throw new Error("currentStock inválido");
    }
  }

  if ("reservedStock" in x) {
    const reservedStock = toInt(x.reservedStock, NaN as never);
    if (!Number.isInteger(reservedStock) || reservedStock < 0) {
      throw new Error("reservedStock inválido");
    }
  }

  if ("retailPrice" in x && x.retailPrice != null && x.retailPrice !== "") {
    const price = Number(x.retailPrice);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("retailPrice inválido");
    }
  }

  if ("status" in x && x.status != null && x.status !== "") {
    const raw = String(x.status).trim().toUpperCase();
    if (raw !== "ACTIVE" && raw !== "INACTIVE" && raw !== "ARCHIVED") {
      throw new Error("status inválido");
    }
  }
}

export function normalizeVariantQuery(input: unknown): VariantQueryDTO {
  const x = (input ?? {}) as Record<string, unknown>;
  return {
    status: toStr(x.status).toUpperCase() || undefined,
  };
}

export { toStr, toNullableStr, toInt, toStatus };