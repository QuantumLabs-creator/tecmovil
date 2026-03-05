// src/modules/customers/domain/customer.repository.ts

import type { CustomerType } from "@/src/generated/prisma/client";

export type CustomerRecord = {
  id: string;

  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;

  customerType: CustomerType;
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
};

export type CustomerListResult = {
  items: CustomerRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CustomerListParams = {
  q?: string;
  active?: string;       // "true" | "false"
  customerType?: string; // "RETAIL" | "WHOLESALE"
  page: number;
  pageSize: number;
};

export type CreateCustomerInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  customerType?: unknown;
  active?: unknown;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface CustomerRepository {
  getById(id: string): Promise<CustomerRecord | null>;
  getByEmail(email: string): Promise<CustomerRecord | null>;
  list(params: CustomerListParams): Promise<CustomerListResult>;
  create(input: any): Promise<CustomerRecord>;
  update(id: string, input: any): Promise<CustomerRecord>;
  delete(id: string): Promise<void>; // soft
}