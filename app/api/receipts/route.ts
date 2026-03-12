// app/api/receipts/route.ts

import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { prisma } from "@/src/shared/db/prisma";
import { PrismaReceiptRepository } from "@/src/modules/receipts/infrastructure/receipt.repo";
import { CreateReceiptUseCase } from "@/src/modules/receipts/application/createReceipt.usecase";
import { SearchReceiptsUseCase } from "@/src/modules/receipts/application/searchReceipts.usecase";

function hasAnyRole(role: string, roles: string[]) {
  return roles.includes(String(role ?? "").toUpperCase());
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const url = new URL(req.url);

    const saleOrderId = url.searchParams.get("saleOrderId") ?? undefined;
    const orderId = url.searchParams.get("orderId") ?? undefined;
    const uploadedById = url.searchParams.get("uploadedById") ?? undefined;

    const isPrivileged = hasAnyRole(session.role, ["ADMIN", "WAREHOUSE", "SELLER"]);

    if (!isPrivileged) {
      // USER: si consulta por saleOrderId, validar que el pedido sea suyo
      if (saleOrderId) {
        const saleOrder = await prisma.saleOrder.findUnique({
          where: { id: saleOrderId },
          select: { id: true, userId: true },
        });

        if (!saleOrder) {
          return fail("Pedido no encontrado", 404);
        }

        if (!saleOrder.userId || saleOrder.userId !== session.userId) {
          return fail("No autorizado", 403);
        }
      } else if (uploadedById) {
        // opcional: permitir buscar por uploadedById, pero solo el propio
        if (uploadedById !== session.userId) {
          return fail("No autorizado", 403);
        }
      } else {
        // si no manda ni saleOrderId ni uploadedById, no autorizamos
        return fail("No autorizado", 403);
      }
    }

    const repo = new PrismaReceiptRepository();
    const uc = new SearchReceiptsUseCase(repo);

    const result = await uc.execute({
      type: url.searchParams.get("type") ?? undefined,
      saleOrderId,
      orderId,
      uploadedById,
      deleted: url.searchParams.get("deleted") ?? undefined,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 10),
    });

    return ok(result);
  } catch (e: any) {
    const msg = e?.message ?? "Error al listar receipts";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return fail("Body inválido", 400);
    }

    // Si es USER y está subiendo a saleOrderId, validar que el pedido sea suyo
    const saleOrderId = String((body as any).saleOrderId ?? "").trim();
    const isPrivileged = hasAnyRole(session.role, ["ADMIN", "WAREHOUSE", "SELLER"]);

    if (!isPrivileged && saleOrderId) {
      const saleOrder = await prisma.saleOrder.findUnique({
        where: { id: saleOrderId },
        select: { id: true, userId: true, status: true },
      });

      if (!saleOrder) {
        return fail("Pedido no encontrado", 404);
      }

      if (!saleOrder.userId || saleOrder.userId !== session.userId) {
        return fail("No autorizado", 403);
      }
    }

    const repo = new PrismaReceiptRepository();
    const uc = new CreateReceiptUseCase(repo);

    const created = await uc.execute(body, session.userId);

    return ok(created);
  } catch (e: any) {
    const msg = e?.message ?? "Error al crear receipt";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}