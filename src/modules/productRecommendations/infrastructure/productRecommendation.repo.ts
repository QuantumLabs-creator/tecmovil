import { prisma } from "@/src/shared/db/prisma";
import type {
  ProductRecommendationRepository,
  ProductRecommendationRecord,
} from "../domain/productRecommendation.repository";

function mapRow(row: any): ProductRecommendationRecord {
  return {
    id: row.id,
    productId: row.productId,
    recommendedProductId: row.recommendedProductId,
    priority: row.priority,
    createdAt: row.createdAt,
    recommendedProduct: {
      id: row.recommendedProduct.id,
      code: row.recommendedProduct.code,
      name: row.recommendedProduct.name,
      image: row.recommendedProduct.image ?? null,
      retailPrice: row.recommendedProduct.retailPrice.toString(),
      currentStock: row.recommendedProduct.currentStock,
      reservedStock: row.recommendedProduct.reservedStock,
      status: row.recommendedProduct.status,
    },
  };
}

export class PrismaProductRecommendationRepository
  implements ProductRecommendationRepository
{
  async listByProduct(productId: string): Promise<ProductRecommendationRecord[]> {
    const rows = await prisma.productRecommendation.findMany({
      where: { productId },
      include: {
        recommendedProduct: {
          select: {
            id: true,
            code: true,
            name: true,
            image: true,
            retailPrice: true,
            currentStock: true,
            reservedStock: true,
            status: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    return rows.map(mapRow);
  }

  async create(input: {
    productId: string;
    recommendedProductId: string;
    priority?: number;
  }): Promise<ProductRecommendationRecord> {
    if (input.productId === input.recommendedProductId) {
      throw new Error("Un producto no puede recomendarse a sí mismo");
    }

    const row = await prisma.productRecommendation.create({
      data: {
        productId: input.productId,
        recommendedProductId: input.recommendedProductId,
        priority: input.priority ?? 0,
      },
      include: {
        recommendedProduct: {
          select: {
            id: true,
            code: true,
            name: true,
            image: true,
            retailPrice: true,
            currentStock: true,
            reservedStock: true,
            status: true,
          },
        },
      },
    });

    return mapRow(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.productRecommendation.delete({
      where: { id },
    });
  }
}