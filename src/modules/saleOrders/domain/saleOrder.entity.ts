import type { CustomerType } from "@/src/generated/prisma/client";

export class SaleOrderEntity {
  static create(input: {
    userId: string | null;
    customerId: string | null;
    sellerId: string | null;

    customerType: CustomerType;
    observations: string | null;

    customerData?: {
      name?: string | null;
      phone?: string | null;
      document?: string | null;
    } | null;

    items: { productId: string; quantity: number }[];
  }) {
    if (!input.userId && !input.customerId) {
      throw new Error("userId o customerId requerido");
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("items requerido");
    }

    for (const it of input.items) {
      if (!String(it.productId ?? "").trim()) throw new Error("productId requerido");
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) throw new Error("quantity inválido");
    }

    const customerData = input.customerData
      ? {
          name: String(input.customerData.name ?? "").trim() || null,
          phone: String(input.customerData.phone ?? "").trim() || null,
          document: String(input.customerData.document ?? "").trim() || null,
        }
      : null;

    return {
      ...input,
      customerData,
    };
  }
}