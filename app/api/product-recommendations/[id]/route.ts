import { NextRequest, NextResponse } from "next/server";

import { PrismaProductRecommendationRepository } from "@/src/modules/productRecommendations/infrastructure/productRecommendation.repo";
import { DeleteProductRecommendationUseCase } from "@/src/modules/productRecommendations/application/deleteProductRecommendation.usecase";

const repo = new PrismaProductRecommendationRepository();

export async function DELETE(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const useCase = new DeleteProductRecommendationUseCase(repo);
    await useCase.execute(id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Error al eliminar recomendación" },
      { status: 400 }
    );
  }
}