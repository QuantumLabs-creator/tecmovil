import { NextRequest, NextResponse } from "next/server";

import { PrismaProductRecommendationRepository } from "@/src/modules/productRecommendations/infrastructure/productRecommendation.repo";
import { ListProductRecommendationsUseCase } from "@/src/modules/productRecommendations/application/listProductRecommendations.usecase";
import { CreateProductRecommendationUseCase } from "@/src/modules/productRecommendations/application/createProductRecommendation.usecase";

const repo = new PrismaProductRecommendationRepository();

export async function GET(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const useCase = new ListProductRecommendationsUseCase(repo);
    const data = await useCase.execute(id);

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "Error al listar recomendaciones",
      },
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

    const useCase = new CreateProductRecommendationUseCase(repo);
    const data = await useCase.execute({
      productId: id,
      recommendedProductId: body?.recommendedProductId,
      priority: body?.priority,
    });

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 201 }
    );
  } catch (e: any) {
    const message = e?.message ?? "Error al crear recomendación";

    const status =
      message.includes("ya existe") || message.includes("sí mismo")
        ? 409
        : 400;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}