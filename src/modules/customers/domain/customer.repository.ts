// src/modules/customers/domain/customer.repository.ts
import type { CustomerStatus } from "./customer-status";

export type CustomerRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  customerType: "RETAIL" | "WHOLESALE";
  status: CustomerStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerListResult = {
  items: CustomerRecord[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type CustomerListParams = {
  q?: string;
  status?: CustomerStatus;
  customerType?: "RETAIL" | "WHOLESALE";
  page?: number;
  pageSize?: number;
};

export type CreateCustomerInput = {
  name: string;
  email?: unknown;
  phone?: unknown;
  document?: unknown;
  customerType?: unknown;
  status?: unknown;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface CustomerRepository {
  getById(id: string): Promise<CustomerRecord | null>;
  getByEmail(email: string): Promise<CustomerRecord | null>;
  getByDocument(document: string): Promise<CustomerRecord | null>;
  list(params: CustomerListParams): Promise<CustomerListResult>;
  create(input: CreateCustomerInput): Promise<CustomerRecord>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerRecord>;
  archive(id: string): Promise<void>;
}