// src/modules/products/application/updateProduct.usecase.ts
import type { ProductRepository, ProductRecord } from "../domain/product.repository";
import { normalizeUpdateProduct } from "../domain/product.rules";
import type { UpdateProductDTO } from "./dtos/product.dto";

export class UpdateProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string, dto: UpdateProductDTO): Promise<ProductRecord> {
    if (!id?.trim()) throw new Error("id requerido");
    const input = normalizeUpdateProduct(dto);
    return this.repo.update(id.trim(), input);
  }
}
