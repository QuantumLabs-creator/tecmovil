// src/modules/users/domain/user.repository.ts

import type { Role } from "@/src/generated/prisma";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  active: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserListParams = {
  q?: string;
  role?: Role;
  active?: boolean;
  page: number;
  pageSize: number;
};

export type UserListResult = {
  items: UserRecord[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type UpdateUserInput = {
  name?: string;
  phone?: string | null;
  role?: Role;
  active?: boolean;
};

export interface UserRepository {
  getById(id: string): Promise<UserRecord | null>;
  list(params: UserListParams): Promise<UserListResult>;
  update(id: string, input: UpdateUserInput): Promise<UserRecord>;
}