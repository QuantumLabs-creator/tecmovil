export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  active?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: "USER" | "SELLER";
};

export type AuthResponse = {
  ok: boolean;
  data: {
    user: AuthUser;
  };
};

export type OkResponse = {
  ok: boolean;
};

export type ApiError = {
  error: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function fetchApi<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw {
      error: data?.error || data?.message || "Error en la operación",
      status: res.status,
    } satisfies ApiError;
  }

  return data as T;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function meApi(): Promise<AuthResponse> {
  return fetchApi<AuthResponse>("/api/auth/me", {
    method: "GET",
    cache: "no-store",
  });
}

export async function logoutApi(): Promise<OkResponse> {
  return fetchApi<OkResponse>("/api/auth/logout", {
    method: "POST",
  });
}

export async function ensureSession(): Promise<boolean> {
  try {
    const result = await meApi();
    return !!result?.data?.user?.id;
  } catch {
    return false;
  }
}