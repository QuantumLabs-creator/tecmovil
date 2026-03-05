// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";

import { PrismaCustomerRepository } from "@/src/modules/customers/infrastructure/customer.repo";
import { CreateCustomerUseCase } from "@/src/modules/customers/application/createCustomer.usecase";
import { SearchCustomersUseCase } from "@/src/modules/customers/application/searchCustomers.usecase";

// (si ya tienes guard) úsalo aquí
// import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";

const repo = new PrismaCustomerRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const usecase = new SearchCustomersUseCase(repo);
    const data = await usecase.execute({
      q: searchParams.get("q") ?? undefined,
      active: searchParams.get("active") ?? undefined,
      customerType: searchParams.get("customerType") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 10),
    });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "Error" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const usecase = new CreateCustomerUseCase(repo);
    const created = await usecase.execute(body);

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "Error" }, { status: 400 });
  }
}