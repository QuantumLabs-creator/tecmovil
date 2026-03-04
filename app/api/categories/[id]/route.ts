// app/api/categories/[id]/route.ts
import { NextRequest } from "next/server";

import { PrismaCategoryRepository } from "@/src/modules/categories/infrastructure/category.repo";
import { GetCategoryUseCase } from "@/src/modules/categories/application/getCategory.usecase";
import { UpdateCategoryUseCase } from "@/src/modules/categories/application/updateCategory.usecase";
import { DeleteCategoryUseCase } from "@/src/modules/categories/application/deleteCategory.usecase";
import { fail, ok } from "@/src/shared/http/api";

const repo = new PrismaCategoryRepository();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const uc = new GetCategoryUseCase(repo);
    const row = await uc.execute(id);
    return ok(row);
  } catch (e: any) {
    const msg = e?.message ?? "Error";
    const status = msg.includes("no encontrada") ? 404 : 400;
    return fail(msg, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const uc = new UpdateCategoryUseCase(repo);
    const updated = await uc.execute(id, body);
    return ok(updated);
  } catch (e: any) {
     const msg = e?.message ?? "Error";
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
    const uc = new DeleteCategoryUseCase(repo);
    await uc.execute(id);
    return ok({ deleted: true });
  } catch (e: any) {
    const msg = e?.message ?? "Error";
    const status = msg.includes("no encontrada") ? 404 : 400;
    return fail(msg, status);
  }
}