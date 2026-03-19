import { prisma } from "@/src/shared/db/prisma";
import { Role, RecordStatus } from "@/src/generated/prisma";

import type {
  AuthRepository,
  CreateUserInput,
  RegisterCustomerUserInput,
} from "../domain/auth.repository";
import type { AuthUserEntity } from "../domain/auth.entity";
import { normalizeEmail, isUserActive } from "../domain/auth.rules";

function toAuthUserEntity(row: {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: Role;
  status: RecordStatus;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AuthUserEntity {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    phone: row.phone,
    role: row.role,
    active: isUserActive(row.status),
    lastLogin: row.lastLogin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaAuthRepository implements AuthRepository {
  async findByEmail(email: string): Promise<AuthUserEntity | null> {
    const row = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

    if (!row) return null;
    return toAuthUserEntity(row);
  }

  async findById(id: string): Promise<AuthUserEntity | null> {
    const row = await prisma.user.findUnique({
      where: { id },
    });

    if (!row) return null;
    return toAuthUserEntity(row);
  }

  async createUser(input: CreateUserInput): Promise<AuthUserEntity> {
    const row = await prisma.user.create({
      data: {
        name: input.name,
        email: normalizeEmail(input.email),
        password: input.password,
        phone: input.phone ?? null,
        role: input.role ?? Role.USER,
      },
    });

    return toAuthUserEntity(row);
  }

  async registerCustomerUser(input: RegisterCustomerUserInput) {
    const result = await prisma.$transaction(async (tx) => {
      const email = normalizeEmail(input.email);
      const document = String(input.document ?? "").trim() || null;
      const phone = String(input.phone ?? "").trim() || null;

      // 1) Validar que no exista ya un usuario con ese email
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("Email ya registrado");
      }

      // 2) Buscar customer existente en orden de prioridad:
      // documento -> email -> teléfono
      let existingCustomer = null;

      if (document) {
        existingCustomer = await tx.customer.findFirst({
          where: {
            document,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      }

      if (!existingCustomer) {
        existingCustomer = await tx.customer.findUnique({
          where: { email },
        });
      }

      if (!existingCustomer && phone) {
        existingCustomer = await tx.customer.findFirst({
          where: {
            phone,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      }

      // 3) Crear el user del login
      const user = await tx.user.create({
        data: {
          name: input.name,
          email,
          password: input.password,
          phone,
          role: Role.USER,
        },
      });

      let customer;

      // 4) Si ya existe customer, decidir si se vincula o si falla
      if (existingCustomer) {
        if (existingCustomer.userId) {
          throw new Error("Ya existe un cliente vinculado con esos datos");
        }

        customer = await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            userId: user.id,

            // Mantener datos existentes si ya estaban, y completar faltantes
            name: existingCustomer.name?.trim() || input.name,
            email: existingCustomer.email ?? email,
            phone: existingCustomer.phone ?? phone,
            document: existingCustomer.document ?? document,
            customerType: existingCustomer.customerType ?? (input.customerType ?? "RETAIL"),
          },
        });
      } else {
        // 5) Si no existe, crear customer nuevo
        customer = await tx.customer.create({
          data: {
            name: input.name,
            email,
            phone,
            document,
            customerType: input.customerType ?? "RETAIL",
            userId: user.id,
          },
        });
      }

      return { user, customer };
    });

    return {
      user: toAuthUserEntity(result.user),
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        email: result.customer.email,
        phone: result.customer.phone,
        document: result.customer.document,
        customerType: result.customer.customerType,
        status: result.customer.status,
      },
    };
  }

  async updateLastLogin(userId: string, at: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: at },
    });
  }
}