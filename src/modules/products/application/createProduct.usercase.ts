import type { ProductRepository } from "../domain/product.repository";
import { ProductEntity } from "../domain/product.entity";
import { assertCreateProductDTO, type CreateProductDTO } from "./dtos/product.dto";
import {
  normalizeText,
  normalizeBoolean,
  normalizeInt,
  normalizeMoney,
} from "../domain/product.rules";

function isBlank(v: unknown) {
  return v === undefined || v === null || String(v).trim() === "";
}

export class CreateProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(input: unknown) {
    assertCreateProductDTO(input);
    const dto = input as CreateProductDTO;

    const name = String(dto.name ?? "").trim();
    if (!name) throw new Error("name requerido");

    const categoryId = String(dto.categoryId ?? "").trim();
    if (!categoryId) throw new Error("categoryId requerido");

    const unitId = String(dto.unitId ?? "").trim();
    if (!unitId) throw new Error("unitId requerido");

    const salePrice = normalizeMoney(dto.salePrice, "salePrice");
    const minSalePrice = isBlank(dto.minSalePrice)
      ? null
      : normalizeMoney(dto.minSalePrice, "minSalePrice");

    const maxSalePrice = isBlank(dto.maxSalePrice)
      ? null
      : normalizeMoney(dto.maxSalePrice, "maxSalePrice");

    // ✅ validación rango
    if (minSalePrice && (minSalePrice as any).greaterThan(salePrice as any)) {
      throw new Error("minSalePrice no puede ser mayor que salePrice");
    }
    if (maxSalePrice && (maxSalePrice as any).lessThan(salePrice as any)) {
      throw new Error("maxSalePrice no puede ser menor que salePrice");
    }
    if (minSalePrice && maxSalePrice && (minSalePrice as any).greaterThan(maxSalePrice as any)) {
      throw new Error("minSalePrice no puede ser mayor que maxSalePrice");
    }

    const entity = ProductEntity.create({
      name,
      description: normalizeText(dto.description) ?? null,

      purchasePrice: normalizeMoney(dto.purchasePrice, "purchasePrice"),
      salePrice,

      // ✅ nuevos
      minSalePrice,
      maxSalePrice,

      minStock: Math.max(0, normalizeInt(dto.minStock, 0)),
      currentStock: Math.max(0, normalizeInt(dto.currentStock, 0)),

      active: normalizeBoolean(dto.active, true),

      categoryId,
      supplierId: normalizeText(dto.supplierId) ?? null,
      unitId,
    });

    return this.repo.create(entity);
  }
}
