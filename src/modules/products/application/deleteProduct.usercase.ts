// src/modules/products/application/deleteProduct.usecase.ts
import type { ProductRepository } from "../domain/product.repository";

export class DeleteProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string) {
    if (!id?.trim()) throw new Error("id requerido");
    await this.repo.delete(id.trim());
  }
}
