// src/modules/products/application/deleteProduct.usecase.ts
import type { ProductRepository } from "../domain/product.repository";

export class DeleteProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string) {
    const pid = String(id ?? "").trim();
    if (!pid) throw new Error("id requerido");

    await this.repo.archive(pid);
  }
}