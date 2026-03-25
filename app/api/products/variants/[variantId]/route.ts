import { NextRequest, NextResponse } from "next/server";

import { PrismaProductRepository } from "@/src/modules/products/infrastructure/product.repo";
import { UpdateProductVariantUseCase } from "@/src/modules/products/application/updateProductVariant.usecase";
import { DeleteProductVariantUseCase } from "@/src/modules/products/application/deleteProductVariant.usecase";

const repo = new PrismaProductRepository();

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await ctx.params;
    const body = await req.json();

    const usecase = new UpdateProductVariantUseCase(repo);
    const data = await usecase.execute(variantId, body);

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Error al actualizar variante" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await ctx.params;

    const usecase = new DeleteProductVariantUseCase(repo);
    await usecase.execute(variantId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Error al eliminar variante" },
      { status: 400 }
    );
  }
}