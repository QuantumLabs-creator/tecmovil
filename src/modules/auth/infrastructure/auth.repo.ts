import { prisma } from "@/src/shared/db/prisma";


import { AuthRepository, CreateUserInput } from "../domain/auth.repository";
import { AuthUserEntity } from "../domain/auth.entity";
import { normalizeEmail } from "../domain/auth.rules";
import { Role } from "@/src/generated/prisma";

export class PrismaAuthRepository implements AuthRepository {
  async findByEmail(email: string): Promise<AuthUserEntity | null> {
    return prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    }) as any;
  }

  async findById(id: string): Promise<AuthUserEntity | null> {
    return prisma.user.findUnique({ where: { id } }) as any;
  }

  async createUser(input: CreateUserInput): Promise<AuthUserEntity> {
    return prisma.user.create({
      data: {
        name: input.name,
        email: normalizeEmail(input.email),
        password: input.password,
        phone: input.phone ?? null,
        role: input.role ?? Role.USER,
      },
    }) as any;
  }

  async updateLastLogin(userId: string, at: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: at },
    });
  }
}