export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/db/prisma";

export async function GET() {
  const users = await prisma.user.count();
  return NextResponse.json({ ok: true, users });
}