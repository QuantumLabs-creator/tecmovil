import { ProductVariantEntity } from "../domain/product-variant.entity";
import type { ProductRepository } from "../domain/product.repository";
import {
  normalizeCreateVariant,
  generateVariantSku,
} from "../domain/product-variant.rules";
import {
  assertCreateProductVariantDTO,
  type CreateProductVariantDTO,
} from "./dtos/product-variant.dto";

export class CreateProductVariantUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(productId: string, input: unknown) {
    const pid = String(productId ?? "").trim();
    if (!pid) throw new Error("productId requerido");

    assertCreateProductVariantDTO(input);
    const dto = input as CreateProductVariantDTO;

    const product = await this.repo.getById(pid);
    if (!product) throw new Error("Producto no encontrado");

    const data = normalizeCreateVariant({
      productId: pid,
      ...dto,
    });

    const duplicated = await this.repo.existsVariantDuplicate({
      productId: pid,
      color: data.color,
      size: data.size,
    });

    if (duplicated) {
      throw new Error("Ya existe una variante con esa combinación");
    }

    if (!data.sku) {
      data.sku = generateVariantSku({
        productCode: product.code,
        color: data.color,
        size: data.size,
      });
    }

    const entity = ProductVariantEntity.create(data);
    const created = await this.repo.createVariant(entity);

    await this.repo.update(pid, { hasVariants: true });

    return created;
  }
}