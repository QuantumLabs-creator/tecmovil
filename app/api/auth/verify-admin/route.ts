import { NextResponse } from "next/server";
import { PrismaAuthRepository } from "@/src/modules/auth/infrastructure/auth.repo";
import { VerifyAdminUseCase } from "@/src/modules/auth/application/verifyAdmin.usecase";

const repo = new PrismaAuthRepository();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const useCase = new VerifyAdminUseCase(repo);
    const isValid = await useCase.execute(email, password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Error interno" },
      { status: 400 }
    );
  }
}