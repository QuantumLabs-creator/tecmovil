import type { ProductRepository } from "../domain/product.repository";
import { normalizeUpdateVariant } from "../domain/product-variant.rules";
import {
  assertUpdateProductVariantDTO,
  type UpdateProductVariantDTO,
} from "./dtos/product-variant.dto";

export class UpdateProductVariantUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string, input: unknown) {
    const vid = String(id ?? "").trim();
    if (!vid) throw new Error("id requerido");

    assertUpdateProductVariantDTO(input);
    const dto = input as UpdateProductVariantDTO;

    const current = await this.repo.getVariantById(vid);
    if (!current) throw new Error("Variante no encontrada");

    const patch = normalizeUpdateVariant(dto);

    const nextColor =
      "color" in patch ? (patch.color as string | null) : current.color;
    const nextSize =
      "size" in patch ? (patch.size as string | null) : current.size;

    if (!nextColor && !nextSize) {
      throw new Error("La variante debe tener al menos color o talla");
    }

    const nextCurrentStock =
      "currentStock" in patch ? Number(patch.currentStock) : current.currentStock;
    const nextReservedStock =
      "reservedStock" in patch ? Number(patch.reservedStock) : current.reservedStock;

    if (nextReservedStock > nextCurrentStock) {
      throw new Error("reservedStock no puede ser mayor que currentStock");
    }

    const duplicated = await this.repo.existsVariantDuplicate({
      productId: current.productId,
      color: nextColor,
      size: nextSize,
      excludeId: vid,
    });

    if (duplicated) {
      throw new Error("Ya existe una variante con esa combinación");
    }

    return this.repo.updateVariant(vid, patch as any);
  }
}