import { Prisma } from "@/src/generated/prisma/client";
import type { CustomerType, PricingType } from "@/src/generated/prisma/client";

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

export function normalizeCustomerType(v: unknown, def: CustomerType = "RETAIL"): CustomerType {
  const s = toStr(v).toUpperCase();
  if (!s) return def;
  if (s === "RETAIL" || s === "WHOLESALE") return s as CustomerType;
  return def;
}

export function calcPricingForItem(input: {
  quantity: number;
  retailPrice: Prisma.Decimal;
  wholesalePrice: Prisma.Decimal | null;
  wholesaleMinQuantity: number;
}): { pricingApplied: PricingType; unitPrice: Prisma.Decimal } {
  const q = Math.max(1, input.quantity);

  const canWholesale =
    input.wholesalePrice !== null &&
    q >= Math.max(1, input.wholesaleMinQuantity ?? 10);

  if (canWholesale) {
    return { pricingApplied: "WHOLESALE", unitPrice: input.wholesalePrice! };
  }

  return { pricingApplied: "RETAIL", unitPrice: input.retailPrice };
}

export function moneyMul(a: Prisma.Decimal, qty: number) {
  return a.mul(new (Prisma.Decimal as any)(String(qty)));
}