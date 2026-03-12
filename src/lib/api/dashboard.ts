export type DashboardResponse = {
  kpis: {
    productos: { total: number; activos: number; sinStock: number };
    movimientos: { hoy: number; mes: number };
    usuarios: { total: number; admins: number };
    mesActual: { month: number; year: number };
  };
  activity: {
    id: string;
    type: "PRODUCT" | "MOVE_IN" | "MOVE_OUT" | "USER";
    title: string;
    subtitle?: string;
    at: string;
  }[];
};

export type ApiError = {
  error: string;
  status: number;
};

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
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
      error: data?.error || "No se pudo completar la operación",
      status: res.status,
    } satisfies ApiError;
  }

  return data as T;
}

export async function getDashboardApi(): Promise<ApiResponse<DashboardResponse>> {
  return fetchApi<ApiResponse<DashboardResponse>>("/api/dashboard", {
    method: "GET",
    cache: "no-store",
  });
}