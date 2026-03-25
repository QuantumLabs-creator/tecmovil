import { NextRequest, NextResponse } from "next/server";

import { PrismaProductRepository } from "@/src/modules/products/infrastructure/product.repo";
import { ListProductVariantsUseCase } from "@/src/modules/products/application/listProductVariants.usecase";
import { CreateProductVariantUseCase } from "@/src/modules/products/application/createProductVariant.usecase";

const repo = new PrismaProductRepository();

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const usecase = new ListProductVariantsUseCase(repo);
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());

    const data = await usecase.execute(id, query);

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Error al listar variantes" },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const usecase = new CreateProductVariantUseCase(repo);
    const data = await usecase.execute(id, body);

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Error al crear variante" },
      { status: 400 }
    );
  }
}