import { ProductStatus } from "@/src/components/products/types";

export type ProductVariantProps = {
  id?: string;
  productId: string;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  retailPrice?: string | null;
  currentStock: number;
  reservedStock: number;
  status: ProductStatus;
};

export class ProductVariantEntity {
  constructor(public readonly props: ProductVariantProps) {}

  static create(props: ProductVariantProps) {
    const productId = String(props.productId ?? "").trim();
    if (!productId) throw new Error("productId requerido");

    const color = String(props.color ?? "").trim() || null;
    const size = String(props.size ?? "").trim() || null;

    if (!color && !size) {
      throw new Error("La variante debe tener al menos color o talla");
    }

    if (!Number.isInteger(props.currentStock) || props.currentStock < 0) {
      throw new Error("currentStock inválido");
    }

    if (!Number.isInteger(props.reservedStock) || props.reservedStock < 0) {
      throw new Error("reservedStock inválido");
    }

    if (props.reservedStock > props.currentStock) {
      throw new Error("reservedStock no puede ser mayor que currentStock");
    }

    return new ProductVariantEntity({
      ...props,
      productId,
      color,
      size,
      sku: String(props.sku ?? "").trim() || null,
      retailPrice: props.retailPrice ? String(props.retailPrice).trim() : null,
      status: props.status ?? "ACTIVE",
    });
  }
}