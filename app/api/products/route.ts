import { created, fail, ok } from "@/src/shared/http/api";
import { PrismaProductRepository } from "@/src/modules/products/infrastructure/product.repo";
import { SearchProductsUseCase } from "@/src/modules/products/application/searchProduct.usecase";
import { CreateProductUseCase } from "@/src/modules/products/application/createProduct.usecase";


const repo = new PrismaProductRepository();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const active = (searchParams.get("active") ?? "").trim();

    const categoryId = (searchParams.get("categoryId") ?? "").trim() || undefined;
    const supplierId = (searchParams.get("supplierId") ?? "").trim() || undefined;
    const unitId = (searchParams.get("unitId") ?? "").trim() || undefined;

    const lowStock = (searchParams.get("lowStock") ?? "").trim() || undefined;

    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "50");

    const uc = new SearchProductsUseCase(repo);

    const result = await uc.execute({
      q,
      active,
      categoryId,
      supplierId,
      unitId,
      lowStock: lowStock === "true",
      page,
      pageSize,
    });

    return ok(result);
  } catch (e: any) {
    return fail(e?.message ?? "Error", 400);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uc = new CreateProductUseCase(repo);
    const row = await uc.execute(body);
    return created({ product: row });
  } catch (e: any) {
    return fail(e?.message ?? "Error", 400);
  }
}