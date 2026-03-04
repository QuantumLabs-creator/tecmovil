import type { ProductRepository } from "../domain/product.repository";
import { ProductEntity } from "../domain/product.entity";
import { assertCreateProductDTO, type CreateProductDTO } from "./dtos/product.dto";
import { normalizeCreateProduct } from "../domain/product.rules";

export class CreateProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(input: unknown) {
    assertCreateProductDTO(input);
    const dto = input as CreateProductDTO;

    const normalized = normalizeCreateProduct(dto);

    const entity = ProductEntity.create({
      code: normalized.code,
      name: normalized.name,
      description: normalized.description ?? null,
      image: normalized.image ?? null,

      purchasePrice: normalized.purchasePrice,
      retailPrice: normalized.retailPrice,
      wholesalePrice: normalized.wholesalePrice,
      wholesaleMinQuantity: normalized.wholesaleMinQuantity,

      minSalePrice: normalized.minSalePrice,
      maxSalePrice: normalized.maxSalePrice,

      minStock: normalized.minStock,
      currentStock: normalized.currentStock,
      reservedStock: normalized.reservedStock,

      active: normalized.active,

      categoryId: normalized.categoryId,
      supplierId: normalized.supplierId,
      unitId: normalized.unitId,
    });

    return this.repo.create(entity);
  }
}
