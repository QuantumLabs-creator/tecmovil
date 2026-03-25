import type { ProductRepository } from "../domain/product.repository";

export class DeleteProductVariantUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string) {
    const vid = String(id ?? "").trim();
    if (!vid) throw new Error("id requerido");

    const current = await this.repo.getVariantById(vid);
    if (!current) throw new Error("Variante no encontrada");

    await this.repo.deleteVariant(vid);

    const remaining = await this.repo.listVariants(current.productId);
    if (remaining.length === 0) {
      await this.repo.update(current.productId, { hasVariants: false } as any);
    }
  }
}