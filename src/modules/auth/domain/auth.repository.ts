import type { Role } from "@/src/generated/prisma";
import { AuthUserEntity } from "./auth.entity";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string; // hashed
  phone?: string | null;
  role?: Role;
};

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUserEntity | null>;
  findById(id: string): Promise<AuthUserEntity | null>;
  createUser(input: CreateUserInput): Promise<AuthUserEntity>;
  updateLastLogin(userId: string, at: Date): Promise<void>;
}