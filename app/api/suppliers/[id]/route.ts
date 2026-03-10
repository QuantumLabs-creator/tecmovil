// app/api/suppliers/[id]/route.ts

import { NextRequest } from "next/server";

import { PrismaSupplierRepository } from "@/src/modules/suppliers/infrastructure/supplier.repo";
import { GetSupplierUseCase } from "@/src/modules/suppliers/application/getSupplier.usecase";
import { UpdateSupplierUseCase } from "@/src/modules/suppliers/application/updateSupplier.usecase";
import { DeleteSupplierUseCase } from "@/src/modules/suppliers/application/deleteSupplier.usecase";
import { ok, fail } from "@/src/shared/http/api";

const repo = new PrismaSupplierRepository();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uc = new GetSupplierUseCase(repo);
    const row = await uc.execute(id);

    return ok(row);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener proveedor";
    const status = msg.includes("no encontrado") || msg.includes("no existe") ? 404 : 400;
    return fail(msg, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const uc = new UpdateSupplierUseCase(repo);
    const updated = await uc.execute(id, body);

    return ok(updated);
  } catch (e: any) {
    const msg = e?.message ?? "Error al actualizar proveedor";
    const status = msg.includes("no encontrado") || msg.includes("no existe") ? 404 : 400;
    return fail(msg, status);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uc = new DeleteSupplierUseCase(repo);
    await uc.execute(id);

    return ok({ deleted: true });
  } catch (e: any) {
    const msg = e?.message ?? "Error al eliminar proveedor";
    const status = msg.includes("no encontrado") || msg.includes("no existe") ? 404 : 400;
    return fail(msg, status);
  }
}