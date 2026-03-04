// app/api/units/route.ts
import { NextResponse } from "next/server";

import { PrismaUnitRepository } from "@/src/modules/units/infrastructure/unit.repo";
import { CreateUnitUseCase } from "@/src/modules/units/application/createUnit.usecase";
import { SearchUnitUseCase } from "@/src/modules/units/application/searchUnit.usecase";

const repo = new PrismaUnitRepository();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const active = (searchParams.get("active") ?? "").trim();
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");

  const uc = new SearchUnitUseCase(repo);
  const result = await uc.execute({ q, active, page, pageSize });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uc = new CreateUnitUseCase(repo);
    const created = await uc.execute(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "Error" },
      { status: 400 }
    );
  }
}