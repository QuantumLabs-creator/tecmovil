import { ok, fail } from "@/src/shared/http/api";
import { PrismaProductRepository } from "@/src/modules/products/infrastructure/product.repo";

const repo = new PrismaProductRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const product = await repo.getByCode(code);

    if (!product) {
      return fail("Producto no encontrado", 404);
    }

    return ok({ product });
  } catch (e: any) {
    return fail(e?.message ?? "Error", 400);
  }
}