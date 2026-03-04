import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { Role } from "@/src/generated/prisma";
import { JwtPayload } from "../domain/auth.entity";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

export async function hashPassword(raw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(raw, salt);
}

export function verifyPassword(raw: string, hashed: string) {
  return bcrypt.compare(raw, hashed);
}

export async function signAccessToken(payload: JwtPayload) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no configurado");

  const role = payload.role ?? Role.USER;

  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);

  const sub = String(payload.sub ?? "");
  const role = (payload.role as Role) ?? Role.USER;

  if (!sub) throw new Error("Token inválido");

  return { sub, role };
}

export function buildAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}