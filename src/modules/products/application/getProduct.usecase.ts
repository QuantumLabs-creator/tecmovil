// src/modules/products/application/getProduct.usecase.ts
import type { ProductRepository, ProductRecord } from "../domain/product.repository";

export class GetProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string): Promise<ProductRecord> {
    const pid = String(id ?? "").trim();
    if (!pid) throw new Error("id requerido");

    const product = await this.repo.getById(pid);
    if (!product || product.status === "ARCHIVED") {
      throw new Error("Producto no encontrado");
    }

    return product;
  }
}