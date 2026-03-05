// app/api/customers/[id]/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaCustomerRepository } from "@/src/modules/customers/infrastructure/customer.repo";
import { GetCustomerUseCase } from "@/src/modules/customers/application/getCustomer.usecase";
import { UpdateCustomerUseCase } from "@/src/modules/customers/application/updateCustomer.usecase";
import { DeleteCustomerUseCase } from "@/src/modules/customers/application/deleteCustomer.usecase";

function hasAnyRole(session: any, roles: string[]) {
  const role = String(session?.role ?? "").toUpperCase();
  return roles.includes(role);
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    await requireAuth();

    const repo = new PrismaCustomerRepository();
    const uc = new GetCustomerUseCase(repo);

    const data = await uc.execute(ctx.params.id);
    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener cliente";
    const status = msg === "No autorizado" ? 401 : 404;
    return fail(msg, status);
  }
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    // ✅ editar clientes normalmente: ADMIN/SELLER
    if (!hasAnyRole(session, ["ADMIN", "SELLER"])) {
      return fail("No autorizado", 401);
    }

    const body = await req.json();

    const repo = new PrismaCustomerRepository();
    const uc = new UpdateCustomerUseCase(repo);

    const data = await uc.execute(ctx.params.id, body);
    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al actualizar cliente";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await requireAuth();

    // ✅ eliminar (soft delete) normalmente: solo ADMIN
    if (!hasAnyRole(session, ["ADMIN"])) {
      return fail("No autorizado", 401);
    }

    const repo = new PrismaCustomerRepository();
    const uc = new DeleteCustomerUseCase(repo);

    await uc.execute(ctx.params.id);
    return ok({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Error al eliminar cliente";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}