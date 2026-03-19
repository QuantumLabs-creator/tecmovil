// src/modules/saleOrders/infrastructure/saleOrder.repo.ts
import { prisma } from "@/src/shared/db/prisma";
import type { Prisma, SaleOrderStatus, PricingType } from "@/src/generated/prisma/client";
import { Prisma as PrismaNS } from "@/src/generated/prisma/client";

import type {
  SaleOrderRepository,
  SaleOrderRecord,
  SaleOrderListParams,
  SaleOrderListResult,
  CreateSaleOrderInput,
} from "../domain/saleOrder.repository";

import { calcPricingForItem, moneyMul, normalizeText } from "../domain/saleOrder.rules";

/** =========================================================
 *  Shared include (keeps mapOrder typings happy)
 *  ========================================================= */
const orderInclude = {
  user: true,
  customer: true,
  seller: true,
  details: {
    include: { product: { select: { id: true, code: true, name: true } } },
  },
} satisfies Prisma.SaleOrderInclude;

/** =========================================================
 *  Mapper
 *  ========================================================= */
function mapOrder(
  o: Prisma.SaleOrderGetPayload<{
    include: typeof orderInclude;
  }>
): SaleOrderRecord {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,

    customerType: o.customerType,
    pricingApplied: o.pricingApplied,
    total: o.total,

    orderDate: o.orderDate,
    deliveryDate: o.deliveryDate ?? null,
    completedDate: o.completedDate ?? null,
    observations: o.observations ?? null,
    createdAt: o.createdAt,

    userId: o.userId ?? null,
    user: o.user ? { id: o.user.id, name: o.user.name, email: o.user.email } : null,

    customerId: o.customerId ?? null,
    customer: o.customer ? { id: o.customer.id, name: o.customer.name, email: o.customer.email ?? null } : null,

    sellerId: o.sellerId ?? null,
    seller: o.seller ? { id: o.seller.id, name: o.seller.name, email: o.seller.email } : null,

    details: o.details.map((d) => ({
      id: d.id,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      subtotal: d.subtotal,
      productId: d.productId,
      product: { id: d.product.id, code: d.product.code, name: d.product.name },
      productSnapshot: (d.productSnapshot as any) ?? null,
    })),
  };
}

/** =========================================================
 *  Helpers
 *  ========================================================= */
async function generateOrderNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const last = await tx.saleOrder.findFirst({
    where: { orderNumber: { startsWith: `SO-${year}-` } },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  const lastNum = last?.orderNumber?.match(/SO-\d{4}-(\d+)/)?.[1];
  const n = lastNum ? Number(lastNum) : 0;
  const next = n + 1;

  return `SO-${year}-${String(next).padStart(5, "0")}`;
}

function safeStr(v?: string | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

/** =========================================================
 *  Repository
 *  ========================================================= */
export class PrismaSaleOrderRepository implements SaleOrderRepository {
  async getById(id: string): Promise<SaleOrderRecord | null> {
    const o = await prisma.saleOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
    return o ? mapOrder(o) : null;
  }

  async list(params: SaleOrderListParams): Promise<SaleOrderListResult> {
    const q = (params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(200, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.SaleOrderWhereInput = {};

    const status = safeStr(params.status)?.toUpperCase();
    if (status) where.status = status as any;

    const userId = safeStr(params.userId);
    if (userId) where.userId = userId;

    const customerId = safeStr(params.customerId);
    if (customerId) where.customerId = customerId;

    const sellerId = safeStr(params.sellerId);
    if (sellerId) where.sellerId = sellerId;

    if (params.from || params.to) {
      where.orderDate = {};
      if (params.from) (where.orderDate as any).gte = new Date(params.from);
      if (params.to) (where.orderDate as any).lte = new Date(params.to);
    }

    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.saleOrder.count({ where }),
      prisma.saleOrder.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
        include: orderInclude,
      }),
    ]);

    return {
      items: items.map(mapOrder),
      meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async createRequest(input: CreateSaleOrderInput, actorUserId: string): Promise<SaleOrderRecord> {
  return prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);

    let finalUserId = input.userId ?? null;
    let finalCustomerId = input.customerId ?? null;

    // =========================================================
    // Resolver / completar customer para compras web
    // =========================================================
    if (finalUserId) {
      const linkedCustomer = await tx.customer.findFirst({
        where: { userId: finalUserId },
      });

      if (!linkedCustomer) {
        throw new Error("No se encontró un perfil de cliente vinculado al usuario");
      }

      const nextName =
        linkedCustomer.name?.trim() ||
        String(input.customerData?.name ?? "").trim() ||
        linkedCustomer.name;

      const nextPhone =
        linkedCustomer.phone ??
        (String(input.customerData?.phone ?? "").trim() || null);

      const nextDocument =
        linkedCustomer.document ??
        (String(input.customerData?.document ?? "").trim() || null);

      // Si quieres obligar datos mínimos al momento de comprar:
      if (!nextPhone || !nextDocument) {
        throw new Error("Completa tus datos de cliente antes de realizar el pedido");
      }

      const updatedCustomer = await tx.customer.update({
        where: { id: linkedCustomer.id },
        data: {
          name: nextName,
          phone: nextPhone,
          document: nextDocument,
        },
      });

      finalCustomerId = updatedCustomer.id;
    }

    // Si no viene userId, al menos debe venir customerId para venta física/manual
    if (!finalUserId && !finalCustomerId) {
      throw new Error("Se requiere un cliente para registrar el pedido");
    }

    // 1) Fetch products involved
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        code: true,
        name: true,
        retailPrice: true,
        wholesalePrice: true,
        wholesaleMinQuantity: true,
        currentStock: true,
        reservedStock: true,
        status: true,
      },
    });

    const byId = new Map(products.map((p) => [p.id, p]));

    // 2) Build details + validate availability
    const details: Prisma.SaleOrderDetailCreateManyOrderInput[] = [];
    let total = new (PrismaNS.Decimal as any)("0") as PrismaNS.Decimal;
    let pricingApplied: PricingType = "RETAIL";

    for (const it of input.items) {
      const qty = Math.max(1, Number(it.quantity));
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("quantity inválido");

      const p = byId.get(it.productId);
      if (!p) throw new Error("Producto no encontrado");
      if (p.status !== "ACTIVE") throw new Error(`Producto inactivo: ${p.name}`);

      const available = p.currentStock - p.reservedStock;
      if (qty > available) {
        throw new Error(`Stock insuficiente para ${p.name}. Disponible: ${available}`);
      }

      const pricing = calcPricingForItem({
        quantity: qty,
        retailPrice: p.retailPrice,
        wholesalePrice: p.wholesalePrice ?? null,
        wholesaleMinQuantity: p.wholesaleMinQuantity,
      });

      if (pricing.pricingApplied === "WHOLESALE") pricingApplied = "WHOLESALE";

      const subtotal = moneyMul(pricing.unitPrice as any, qty);
      total = total.add(subtotal);

      const snapshot = {
        productId: p.id,
        code: p.code,
        name: p.name,
        retailPrice: String(p.retailPrice),
        wholesalePrice: p.wholesalePrice ? String(p.wholesalePrice) : null,
        wholesaleMinQuantity: p.wholesaleMinQuantity,
        pricingApplied: pricing.pricingApplied,
      };

      details.push({
        productId: p.id,
        quantity: qty,
        unitPrice: pricing.unitPrice as any,
        subtotal: subtotal as any,
        productSnapshot: snapshot as any,
      });
    }

    // 3) Create order + details
    const created = await tx.saleOrder.create({
      data: {
        orderNumber,
        status: "PENDING_REQUEST",
        customerType: input.customerType,
        pricingApplied,
        total,
        orderDate: new Date(),
        observations: normalizeText(input.observations) ?? null,

        userId: finalUserId,
        customerId: finalCustomerId,
        sellerId: input.sellerId ?? null,

        details: { createMany: { data: details } },
      },
      include: orderInclude,
    });

    // 4) Audit
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "SaleOrder",
        entityId: created.id,
        changes: { createdBy: actorUserId } as any,
        userId: actorUserId,
        saleOrderId: created.id,
      },
    });

    return mapOrder(created);
  });
}

  async approve(id: string, adminId: string): Promise<SaleOrderRecord> {
    return prisma.$transaction(async (tx) => {
      const order = await tx.saleOrder.findUnique({
        where: { id },
        include: { details: true },
      });
      if (!order) throw new Error("Pedido no encontrado");
      if (order.status !== "PENDING_REQUEST") throw new Error("Solo se puede aprobar PENDING_REQUEST");

      const paymentProof = await tx.receipt.findFirst({
        where: {
          saleOrderId: id,
          type: "PAYMENT_PROOF",
          deleted: false,
        },
        select: { id: true },
      });

      if (!paymentProof) {
        throw new Error("No se puede aprobar el pedido sin comprobante de pago");
      }


      // validate + reserve
      for (const d of order.details) {
        const p = await tx.product.findUnique({
          where: { id: d.productId },
          select: { id: true, name: true, currentStock: true, reservedStock: true },
        });
        if (!p) throw new Error("Producto no encontrado");

        const available = p.currentStock - p.reservedStock;
        if (d.quantity > available) throw new Error(`Stock insuficiente para ${p.name}. Disponible: ${available}`);

        await tx.product.update({
          where: { id: p.id },
          data: { reservedStock: { increment: d.quantity } },
        });

        await tx.movement.create({
          data: {
            type: "RESERVE",
            quantity: d.quantity,
            stockBefore: p.currentStock,
            stockAfter: p.currentStock, // currentStock unchanged on reserve
            reason: "Reserva por aprobación de pedido",
            unitPrice: d.unitPrice,
            reference: order.id,
            productId: p.id,
            userId: adminId,
          },
        });
      }

      const updated = await tx.saleOrder.update({
        where: { id },
        data: {
          status: "APPROVED",
          auditLogs: {
            create: {
              action: "APPROVE",
              entityType: "SaleOrder",
              entityId: id,
              changes: { status: { from: order.status, to: "APPROVED" } } as any,
              userId: adminId,
            },
          },
        },
        include: orderInclude,
      });

      return mapOrder(updated);
    });
  }

  async reject(id: string, adminId: string, reason: string): Promise<SaleOrderRecord> {
    return prisma.$transaction(async (tx) => {
      const order = await tx.saleOrder.findUnique({
        where: { id },
        include: { details: true },
      });
      if (!order) throw new Error("Pedido no encontrado");
      if (order.status !== "PENDING_REQUEST") throw new Error("Solo se puede rechazar PENDING_REQUEST");

      const updated = await tx.saleOrder.update({
        where: { id },
        data: {
          status: "REJECTED",
          observations: reason,
          auditLogs: {
            create: {
              action: "REJECT",
              entityType: "SaleOrder",
              entityId: id,
              changes: { reason } as any,
              userId: adminId,
            },
          },
        },
        include: orderInclude,
      });

      return mapOrder(updated);
    });
  }

  async cancel(id: string, actorId: string, reason: string): Promise<SaleOrderRecord> {
    return prisma.$transaction(async (tx) => {
      const order = await tx.saleOrder.findUnique({
        where: { id },
        include: { details: true },
      });
      if (!order) throw new Error("Pedido no encontrado");
      if (order.status === "COMPLETED") throw new Error("No se puede cancelar un pedido COMPLETED");
      if (order.status === "CANCELLED") {
        const existing = await tx.saleOrder.findUnique({ where: { id }, include: orderInclude });
        return mapOrder(existing!);
      }

      // release reservation if needed
      if (["APPROVED", "PREPARING", "READY"].includes(order.status)) {
        for (const d of order.details) {
          const p = await tx.product.findUnique({
            where: { id: d.productId },
            select: { id: true, currentStock: true, reservedStock: true },
          });
          if (!p) continue;

          const dec = Math.min(d.quantity, p.reservedStock);
          if (dec > 0) {
            await tx.product.update({
              where: { id: p.id },
              data: { reservedStock: { decrement: dec } },
            });

            await tx.movement.create({
              data: {
                type: "RELEASE",
                quantity: dec,
                stockBefore: p.currentStock,
                stockAfter: p.currentStock,
                reason: `Liberación por cancelación: ${reason}`,
                unitPrice: d.unitPrice,
                reference: order.id,
                productId: p.id,
                userId: actorId,
              },
            });
          }
        }
      }

      const updated = await tx.saleOrder.update({
        where: { id },
        data: {
          status: "CANCELLED",
          observations: reason,
          auditLogs: {
            create: {
              action: "CANCEL",
              entityType: "SaleOrder",
              entityId: id,
              changes: { reason } as any,
              userId: actorId,
            },
          },
        },
        include: orderInclude,
      });

      return mapOrder(updated);
    });
  }

  async setStatus(id: string, actorId: string, status: "PREPARING" | "READY" | "COMPLETED"): Promise<SaleOrderRecord> {
    return prisma.$transaction(async (tx) => {
      const order = await tx.saleOrder.findUnique({
        where: { id },
        include: { details: true },
      });
      if (!order) throw new Error("Pedido no encontrado");

      const current = order.status;

      const allowed: Record<SaleOrderStatus, SaleOrderStatus[]> = {
        PENDING_REQUEST: [],
        APPROVED: ["PREPARING", "READY", "CANCELLED"],
        PREPARING: ["READY", "CANCELLED"],
        READY: ["COMPLETED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
        REJECTED: [],
      };

      if (!allowed[current].includes(status as any)) {
        throw new Error(`No se puede pasar de ${current} a ${status}`);
      }

      // if COMPLETED: decrement currentStock and decrement reservedStock (release)
      if (status === "COMPLETED") {
        for (const d of order.details) {
          const p = await tx.product.findUnique({
            where: { id: d.productId },
            select: { id: true, name: true, currentStock: true, reservedStock: true },
          });
          if (!p) throw new Error("Producto no encontrado");

          const release = Math.min(d.quantity, p.reservedStock);
          const afterStock = p.currentStock - d.quantity;
          if (afterStock < 0) throw new Error(`Stock insuficiente para completar: ${p.name}`);

          await tx.product.update({
            where: { id: p.id },
            data: {
              currentStock: { decrement: d.quantity },
              reservedStock: { decrement: release },
            },
          });

          await tx.movement.create({
            data: {
              type: "OUT",
              quantity: d.quantity,
              stockBefore: p.currentStock,
              stockAfter: afterStock,
              reason: "Salida por venta (pedido completado)",
              unitPrice: d.unitPrice,
              reference: order.id,
              productId: p.id,
              userId: actorId,
            },
          });
        }
      }

      const updated = await tx.saleOrder.update({
        where: { id },
        data: {
          status: status as any,
          completedDate: status === "COMPLETED" ? new Date() : order.completedDate,
          auditLogs: {
            create: {
              action: "STATUS",
              entityType: "SaleOrder",
              entityId: id,
              changes: { status: { from: current, to: status } } as any,
              userId: actorId,
            },
          },
        },
        include: orderInclude,
      });

      return mapOrder(updated);
    });
  }
}