// src/modules/receipts/infrastructure/receipt.repo.ts

import { prisma } from "@/src/shared/db/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import type {
  ReceiptRepository,
  ReceiptRecord,
  ReceiptListParams,
  ReceiptListResult,
  CreateReceiptInput,
  UpdateReceiptInput,
  DeleteReceiptInput,
} from "../domain/receipt.repository";

import { ReceiptEntity } from "../domain/receipt.entity";

function mapReceipt(
  r: Prisma.ReceiptGetPayload<{ include: { uploadedBy: true } }>
): ReceiptRecord {
  return {
    id: r.id,
    type: r.type,
    fileUrl: r.fileUrl,
    fileName: r.fileName,
    fileSize: r.fileSize,
    mimeType: r.mimeType,
    uploadedAt: r.uploadedAt,

    deleted: r.deleted,
    deletedAt: r.deletedAt ?? null,
    deletionReason: r.deletionReason ?? null,
    autoDeleteAt: r.autoDeleteAt ?? null,

    orderId: r.orderId ?? null,
    saleOrderId: r.saleOrderId ?? null,
    uploadedById: r.uploadedById,

    uploadedBy: r.uploadedBy
      ? {
          id: r.uploadedBy.id,
          name: r.uploadedBy.name,
          email: r.uploadedBy.email,
        }
      : undefined,
  };
}

export class PrismaReceiptRepository implements ReceiptRepository {
  async getById(id: string): Promise<ReceiptRecord | null> {
    const row = await prisma.receipt.findUnique({
      where: { id },
      include: { uploadedBy: true },
    });

    return row ? mapReceipt(row) : null;
  }

  async list(params: ReceiptListParams): Promise<ReceiptListResult> {
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(200, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReceiptWhereInput = {};

    if (params.type) where.type = params.type;
    if (params.orderId) where.orderId = params.orderId;
    if (params.saleOrderId) where.saleOrderId = params.saleOrderId;
    if (params.uploadedById) where.uploadedById = params.uploadedById;
    if (params.deleted !== undefined) where.deleted = params.deleted;

    const [total, items] = await Promise.all([
      prisma.receipt.count({ where }),
      prisma.receipt.findMany({
        where,
        include: { uploadedBy: true },
        orderBy: [{ uploadedAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(mapReceipt),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async create(input: CreateReceiptInput): Promise<ReceiptRecord> {
    const data = ReceiptEntity.create(input);

    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        select: { id: true },
      });
      if (!order) throw new Error("Order no existe");
    }

    if (data.saleOrderId) {
      const saleOrder = await prisma.saleOrder.findUnique({
        where: { id: data.saleOrderId },
        select: { id: true },
      });
      if (!saleOrder) throw new Error("SaleOrder no existe");
    }

    const uploader = await prisma.user.findUnique({
      where: { id: data.uploadedById },
      select: { id: true },
    });
    if (!uploader) throw new Error("Usuario no existe");

    const created = await prisma.receipt.create({
      data,
      include: { uploadedBy: true },
    });

    return mapReceipt(created);
  }

  async update(id: string, input: UpdateReceiptInput): Promise<ReceiptRecord> {
    const existing = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!existing) throw new Error("Receipt no encontrado");
    if (existing.deleted) throw new Error("No se puede actualizar un receipt eliminado");

    const data = ReceiptEntity.update(input) as Prisma.ReceiptUpdateInput;

    const updated = await prisma.receipt.update({
      where: { id },
      data,
      include: { uploadedBy: true },
    });

    return mapReceipt(updated);
  }

  async softDelete(id: string, input?: DeleteReceiptInput): Promise<ReceiptRecord> {
    const existing = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!existing) throw new Error("Receipt no encontrado");

    const data = ReceiptEntity.delete(input?.reason) as Prisma.ReceiptUpdateInput;

    const updated = await prisma.receipt.update({
      where: { id },
      data,
      include: { uploadedBy: true },
    });

    return mapReceipt(updated);
  }
}