import type { Role } from "@/src/generated/prisma";

export type AuthUserEntity = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: Role;
  active: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUserEntity = Omit<AuthUserEntity, "password">;

export type JwtPayload = {
  sub: string;
  role: Role;
};