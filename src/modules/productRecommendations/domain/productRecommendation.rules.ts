function toStr(v: unknown) {
  return String(v ?? "").trim();
}

export function normalizeId(v: unknown): string {
  const s = toStr(v);
  if (!s) throw new Error("id inválido");
  return s;
}

export function normalizePriority(v: unknown): number {
  if (v === undefined || v === null || toStr(v) === "") return 0;

  const n = Number(v);
  if (!Number.isFinite(n)) return 0;

  return Math.max(0, Math.trunc(n));
}

export function assertDifferentProducts(
  productId: string,
  recommendedProductId: string
) {
  if (productId === recommendedProductId) {
    throw new Error("Un producto no puede recomendarse a sí mismo");
  }
}