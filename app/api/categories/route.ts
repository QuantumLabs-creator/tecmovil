// app/api/categories/route.ts
import { NextResponse } from "next/server";

import { PrismaCategoryRepository } from "@/src/modules/categories/infrastructure/category.repo";
import { CreateCategoryUseCase } from "@/src/modules/categories/application/createCategory.usecase";
import { SearchCategoryUseCase } from "@/src/modules/categories/application/searchCategory.usecase";
import { fail, ok } from "@/src/shared/http/api";

const repo = new PrismaCategoryRepository();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const q = (searchParams.get("q") ?? "").trim();
        const active = (searchParams.get("active") ?? "").trim();
        const page = Number(searchParams.get("page") ?? "1");
        const pageSize = Number(searchParams.get("pageSize") ?? "50");

        const uc = new SearchCategoryUseCase(repo);
        const result = await uc.execute({ q, active, page, pageSize });

        return ok(result);
    } catch (e: any) {
        return fail(e?.message ?? "Error", 400);
    }

}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const uc = new CreateCategoryUseCase(repo);
        const created = await uc.execute(body);
        return NextResponse.json(created, { status: 201 });
    } catch (e: any) {
        return fail(e?.message ?? "Error", 400);
    }
}