// app/api/units/[id]/route.ts

import { NextRequest } from "next/server";

import { PrismaUnitRepository } from "@/src/modules/units/infrastructure/unit.repo";
import { GetUnitUseCase } from "@/src/modules/units/application/getUnit.usecase";
import { UpdateUnitUseCase } from "@/src/modules/units/application/updateUnit.usecase";
import { DeleteUnitUseCase } from "@/src/modules/units/application/deleteUnit.usecase";
import { ok, fail } from "@/src/shared/http/api";

const repo = new PrismaUnitRepository();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uc = new GetUnitUseCase(repo);
    const row = await uc.execute(id);

    return ok(row);
  } catch (e: any) {
    const msg = e?.message ?? "Error al obtener unidad";
    const status = msg.includes("no encontrada") ? 404 : 400;
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

    const uc = new UpdateUnitUseCase(repo);
    const updated = await uc.execute(id, body);

    return ok(updated);
  } catch (e: any) {
    const msg = e?.message ?? "Error al actualizar unidad";
    const status = msg.includes("no encontrada") ? 404 : 400;
    return fail(msg, status);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uc = new DeleteUnitUseCase(repo);
    await uc.execute(id);

    return ok({ deleted: true });
  } catch (e: any) {
    const msg = e?.message ?? "Error al eliminar unidad";
    const status = msg.includes("no encontrada") ? 404 : 400;
    return fail(msg, status);
  }
}