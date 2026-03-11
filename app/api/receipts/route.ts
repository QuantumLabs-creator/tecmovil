// app/api/receipts/route.ts

import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

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

    const repo = new PrismaReceiptRepository();
    const uc = new SearchReceiptsUseCase(repo);

    const saleOrderId = url.searchParams.get("saleOrderId") ?? undefined;
    const orderId = url.searchParams.get("orderId") ?? undefined;
    const uploadedById = url.searchParams.get("uploadedById") ?? undefined;

    const isPrivileged = hasAnyRole(session.role, ["ADMIN", "WAREHOUSE", "SELLER"]);

    if (!isPrivileged) {
      if (!uploadedById || uploadedById !== session.userId) {
        return fail("No autorizado", 403);
      }
    }

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