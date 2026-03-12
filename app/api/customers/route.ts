import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

import { PrismaCustomerRepository } from "@/src/modules/customers/infrastructure/customer.repo";
import { SearchCustomersUseCase } from "@/src/modules/customers/application/searchCustomers.usecase";
import { CreateCustomerUseCase } from "@/src/modules/customers/application/createCustomer.usecase";

function hasAnyRole(session: any, roles: string[]) {
  const role = String(session?.role ?? "").toUpperCase();
  return roles.includes(role);
}

export async function GET(req: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");

    const repo = new PrismaCustomerRepository();
    const uc = new SearchCustomersUseCase(repo);

    const data = await uc.execute({
      q,
      page,
      pageSize,
    });

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al listar clientes";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();

    if (!hasAnyRole(session, ["ADMIN", "SELLER"])) {
      return fail("No autorizado", 403);
    }

    const body = await req.json();

    const repo = new PrismaCustomerRepository();
    const uc = new CreateCustomerUseCase(repo);

    const data = await uc.execute(body);

    return ok(data);
  } catch (e: any) {
    const msg = e?.message ?? "Error al crear cliente";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}