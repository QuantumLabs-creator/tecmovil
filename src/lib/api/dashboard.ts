export type DashboardResponse = {
  kpis: {
    productos: {
      total: number;
      activos: number;
      sinStock: number;
    };
    movimientos: {
      hoy: number;
      mes: number;
    };
    ordenes: {
      pendientes: number;
      aprobadas: number;
    };
    mesActual: {
      month: number;
      year: number;
    };
  };
  activity: {
    id: string;
    type: "PRODUCT" | "MOVE_IN" | "MOVE_OUT" | "ORDER";
    title: string;
    subtitle?: string;
    at: string;
  }[];
};

export type DashboardApiResponse = {
  ok: boolean;
  data: DashboardResponse;
};

export type ApiError = {
  error: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
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

export async function getDashboardApi(): Promise<DashboardApiResponse> {
  return fetchApi<DashboardApiResponse>("/api/dashboard", {
    method: "GET",
    cache: "no-store",
  });
}