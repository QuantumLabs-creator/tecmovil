// src/modules/saleOrders/domain/saleOrder.entity.ts
import type { CustomerType } from "@/src/generated/prisma/client";

export class SaleOrderEntity {
  static create(input: {
    userId: string | null;
    customerId: string | null;
    sellerId: string | null;

    customerType: CustomerType;
    observations: string | null;

    items: { productId: string; quantity: number }[];
  }) {
    if (!input.userId && !input.customerId) {
      // web: userId viene del token normalmente; tienda: customerId
      // si no tienes ninguno, no sabemos a quién pertenece el pedido
      throw new Error("userId o customerId requerido");
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("items requerido");
    }

    for (const it of input.items) {
      if (!String(it.productId ?? "").trim()) throw new Error("productId requerido");
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) throw new Error("quantity inválido");
    }

    return { ...input };
  }
}