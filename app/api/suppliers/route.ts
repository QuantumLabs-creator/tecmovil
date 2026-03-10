// app/api/suppliers/route.ts

import { PrismaSupplierRepository } from "@/src/modules/suppliers/infrastructure/supplier.repo";
import { CreateSupplierUseCase } from "@/src/modules/suppliers/application/createSupplier.usecase";
import { SearchSupplierUseCase } from "@/src/modules/suppliers/application/searchSupplier.usecase";
import { ok, fail } from "@/src/shared/http/api";

const repo = new PrismaSupplierRepository();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const active = (searchParams.get("active") ?? "").trim();
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "50");

    const uc = new SearchSupplierUseCase(repo);
    const result = await uc.execute({ q, active, page, pageSize });

    return ok(result);
  } catch (e: any) {
    return fail(e?.message ?? "Error al buscar proveedores", 400);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const uc = new CreateSupplierUseCase(repo);
    const created = await uc.execute(body);

    return ok(created);
  } catch (e: any) {
    return fail(e?.message ?? "Error al crear proveedor", 400);
  }
}