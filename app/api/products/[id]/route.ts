import { fail, ok } from "@/src/shared/http/api";
import { PrismaProductRepository } from "@/src/modules/products/infrastructure/product.repo";
import { GetProductUseCase } from "@/src/modules/products/application/getProduct.usecase";
import { UpdateProductUseCase } from "@/src/modules/products/application/updateProduct.usecase";
import { DeleteProductUseCase } from "@/src/modules/products/application/deleteProduct.usecase";

const repo = new PrismaProductRepository();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uc = new GetProductUseCase(repo);
    const row = await uc.execute(id);
    return ok({ product: row });
  } catch (e: any) {
    return fail(e?.message ?? "Error", 404);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const uc = new UpdateProductUseCase(repo);
    const updated = await uc.execute(id, body);

    return ok({ product: updated });
  } catch (e: any) {
    return fail(e?.message ?? "Error", 400);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uc = new DeleteProductUseCase(repo);
    await uc.execute(id);
    return ok({ deleted: true });
  } catch (e: any) {
    return fail(e?.message ?? "Error", 400);
  }
}