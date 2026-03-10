// src/components/users/types.ts

export type UserRole = "ADMIN" | "USER" | "WAREHOUSE" | "SELLER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  phone: string;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserDraft = Omit<User, "id" | "createdAt" | "updatedAt" | "lastLogin"> & {
  password?: string;
};

export const emptyUserDraft: UserDraft = {
  name: "",
  email: "",
  role: "USER",
  active: true,
  password: "",
  phone: "",
};