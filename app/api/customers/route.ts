// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import { PrismaCustomerRepository } from "@/src/modules/customers/infrastructure/customer.repo";
import { GetCustomerUseCase } from "@/src/modules/customers/application/getCustomer.usecase";
import { UpdateCustomerUseCase } from "@/src/modules/customers/application/updateCustomer.usecase";
import { DeleteCustomerUseCase } from "@/src/modules/customers/application/deleteCustomer.usecase";

const repo = new PrismaCustomerRepository();

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const usecase = new GetCustomerUseCase(repo);
    const data = await usecase.execute(ctx.params.id);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "Error" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const body = await req.json();
    const usecase = new UpdateCustomerUseCase(repo);
    const data = await usecase.execute(ctx.params.id, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "Error" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, ctx: { params: { id: string } }) {
  try {
    const usecase = new DeleteCustomerUseCase(repo);
    await usecase.execute(ctx.params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message ?? "Error" }, { status: 400 });
  }
}