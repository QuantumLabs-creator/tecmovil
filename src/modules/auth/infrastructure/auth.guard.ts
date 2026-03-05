import { cookies } from "next/headers";
import { verifyAccessToken } from "./auth.utils";
import type { Role } from "@/src/generated/prisma";

export type AuthSession = {
  userId: string;
  role: Role;
};

export async function requireAuth(): Promise<AuthSession> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) throw new Error("No autorizado");

  const payload = await verifyAccessToken(token); // { sub, role }
  const userId = String(payload.sub ?? "").trim();
  if (!userId) throw new Error("No autorizado");

  return { userId, role: payload.role };
}