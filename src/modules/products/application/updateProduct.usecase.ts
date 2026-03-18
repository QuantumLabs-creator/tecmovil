// src/modules/products/application/updateProduct.usecase.ts
import type { ProductRepository, ProductRecord } from "../domain/product.repository";
import { normalizeUpdateProduct } from "../domain/product.rules";
import { assertUpdateProductDTO, type UpdateProductDTO } from "./dtos/product.dto";

export class UpdateProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string, dto: unknown): Promise<ProductRecord> {
    const pid = String(id ?? "").trim();
    if (!pid) throw new Error("id requerido");

    assertUpdateProductDTO(dto);
    const input = normalizeUpdateProduct(dto as UpdateProductDTO);

    return this.repo.update(pid, input);
  }
}