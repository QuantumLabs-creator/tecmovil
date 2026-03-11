// app/api/receipts/[id]/route.ts

import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaReceiptRepository } from "@/src/modules/receipts/infrastructure/receipt.repo";
import { GetReceiptUseCase } from "@/src/modules/receipts/application/getReceipt.usecase";
import { UpdateReceiptUseCase } from "@/src/modules/receipts/application/updateReceipt.usecase";
import { DeleteReceiptUseCase } from "@/src/modules/receipts/application/deleteReceipt.usecase";

function hasAnyRole(role: string, roles: string[]) {
  return roles.includes(String(role ?? "").toUpperCase());
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    const repo = new PrismaReceiptRepository();
    const uc = new GetReceiptUseCase(repo);

    const data = await uc.execute(id);

    const isPrivileged = hasAnyRole(session.role, ["ADMIN", "WAREHOUSE", "SELLER"]);

    if (!isPrivileged) {
      if (!data.uploadedById || data.uploadedById !== session.userId) {
        return fail("No autorizado", 403);
      }
    }

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener receipt";
    const status = msg === "No autorizado" ? 401 : 404;
    return fail(msg, status);
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();

    if (!hasAnyRole(session.role, ["ADMIN"])) {
      return fail("No autorizado", 403);
    }

    const { id } = await ctx.params;
    const body = await req.json();

    const repo = new PrismaReceiptRepository();
    const uc = new UpdateReceiptUseCase(repo);

    const updated = await uc.execute(id, body);

    return ok(updated);
  } catch (e: any) {
    const msg = e?.message ?? "Error al actualizar receipt";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    const repo = new PrismaReceiptRepository();
    const getUc = new GetReceiptUseCase(repo);

    const receipt = await getUc.execute(id);

    const isPrivileged = hasAnyRole(session.role, ["ADMIN"]);

    if (!isPrivileged) {
      if (!receipt.uploadedById || receipt.uploadedById !== session.userId) {
        return fail("No autorizado", 403);
      }
    }

    const body = await req.json().catch(() => ({}));

    const deleteUc = new DeleteReceiptUseCase(repo);
    const deleted = await deleteUc.execute(id, body);

    return ok(deleted);
  } catch (e: any) {
    const msg = e?.message ?? "Error al eliminar receipt";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}