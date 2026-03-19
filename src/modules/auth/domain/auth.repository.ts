import type { CustomerType, Role, RecordStatus } from "@/src/generated/prisma";
import type { AuthUserEntity } from "./auth.entity";

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: Role;
};

export type RegisterCustomerUserInput = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  document?: string | null;
  customerType?: CustomerType;
};

export type RegisteredCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  customerType: CustomerType;
  status: RecordStatus;
};

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUserEntity | null>;
  findById(id: string): Promise<AuthUserEntity | null>;
  createUser(input: CreateUserInput): Promise<AuthUserEntity>;

  registerCustomerUser(
    input: RegisterCustomerUserInput
  ): Promise<{
    user: AuthUserEntity;
    customer: RegisteredCustomer;
  }>;

  updateLastLogin(userId: string, at: Date): Promise<void>;
}