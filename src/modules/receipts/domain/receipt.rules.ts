// src/modules/receipts/domain/receipt.rules.ts

function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = toStr(v);
  return s.length ? s : null;
}

export function normalizeRequiredText(v: unknown, field: string): string {
  const s = toStr(v);
  if (!s) throw new Error(`${field} requerido`);
  return s;
}

export function normalizePositiveInt(v: unknown, field: string): number {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${field} inválido`);
  return n;
}

export function normalizeBoolean(v: unknown, defaultValue = false): boolean {
  if (v === undefined || v === null || String(v).trim() === "") return defaultValue;
  if (typeof v === "boolean") return v;

  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "si"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;

  return defaultValue;
}

export function normalizeDateOrNull(v: unknown): Date | null {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new Error("Fecha inválida");
  return d;
}

export function validateReceiptRelation(input: {
  orderId?: string | null;
  saleOrderId?: string | null;
}) {
  const orderId = normalizeText(input.orderId);
  const saleOrderId = normalizeText(input.saleOrderId);

  const count = Number(!!orderId) + Number(!!saleOrderId);

  if (count !== 1) {
    throw new Error("El receipt debe pertenecer a exactamente un orderId o un saleOrderId");
  }

  return { orderId, saleOrderId };
}

export function validateMimeType(mimeType: string) {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "application/pdf",
  ];

  if (!allowed.includes(mimeType)) {
    throw new Error("mimeType no permitido");
  }

  return mimeType;
}