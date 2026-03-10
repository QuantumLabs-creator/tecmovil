// src/lib/api/users.ts

import type { UserRole } from "@/src/components/users/types";

export type UserApiRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserListData = {
  items: UserApiRecord[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type SearchUsersParams = {
  q?: string;
  role?: UserRole;
  active?: boolean;
  page?: number;
  pageSize?: number;
};

export type UpdateUserPayload = {
  name?: string;
  phone?: string | null;
  role?: UserRole;
  active?: boolean;
};

export type ApiError = {
  error: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw {
      error: data?.error || "Error en la operación",
      status: res.status,
    } satisfies ApiError;
  }

  return data as ApiEnvelope<T>;
}

function buildQuery(params?: SearchUsersParams) {
  if (!params) return "";

  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (params.role) sp.set("role", params.role);
  if (params.active !== undefined) sp.set("active", String(params.active));
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getUsersApi(
  params?: SearchUsersParams
): Promise<ApiEnvelope<UserListData>> {
  return fetchApi<UserListData>(`/api/users${buildQuery(params)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function getUserByIdApi(id: string): Promise<ApiEnvelope<UserApiRecord>> {
  return fetchApi<UserApiRecord>(`/api/users/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function updateUserApi(
  id: string,
  payload: UpdateUserPayload
): Promise<ApiEnvelope<UserApiRecord>> {
  return fetchApi<UserApiRecord>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}