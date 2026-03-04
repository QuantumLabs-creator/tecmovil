// src/modules/products/application/getProduct.usecase.ts
import type { ProductRepository, ProductRecord } from "../domain/product.repository";

export class GetProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string): Promise<ProductRecord> {
    if (!id?.trim()) throw new Error("id requerido");

    const product = await this.repo.getById(id.trim());
    if (!product) throw new Error("Producto no encontrado");

    return product;
  }
}
