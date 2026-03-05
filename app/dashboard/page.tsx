"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type DashboardResponse = {
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // ✅ nuevo endpoint sugerido para inventarios
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar dashboard");
      const json = (await res.json()) as DashboardResponse;
      setData(json);
    } catch (e: any) {
      toast.error("Error", { description: e?.message ?? "Intenta nuevamente" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards = useMemo(() => {
    const k = data?.kpis;
    return [
      {
        title: "Productos",
        value: k ? String(k.productos.total) : "—",
        hint: k
          ? `Activos: ${k.productos.activos} • Sin stock: ${k.productos.sinStock}`
          : "Registros totales",
      },
      {
        title: "Movimientos (hoy)",
        value: k ? String(k.movimientos.hoy) : "—",
        hint: k
          ? `Mes: ${k.movimientos.mes} • ${k.mesActual.month}/${k.mesActual.year}`
          : "Entradas + salidas",
      },
      {
        title: "Usuarios",
        value: k ? String(k.usuarios.total) : "—",
        hint: k ? `Admins: ${k.usuarios.admins}` : "Cuentas registradas",
      },
      {
        title: "Periodo",
        value: k ? `${k.mesActual.month}/${k.mesActual.year}` : "—",
        hint: "Mes actual",
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
          >
            <div className="text-sm text-zinc-300">{c.title}</div>
            <div className="mt-2 text-3xl font-semibold">{loading ? "—" : c.value}</div>
            <div className="mt-2 text-xs text-zinc-400">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="relative h-[calc(100dvh-400px)] overflow-x-auto overflow-y-auto">
            <div className="text-sm font-medium">Actividad reciente</div>

            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              {loading ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
                  Cargando actividad...
                </div>
              ) : !data || data.activity.length === 0 ? (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
                  Aún no hay actividad para mostrar.
                </div>
              ) : (
                data.activity.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{a.title}</div>
                        {a.subtitle ? (
                          <div className="mt-0.5 text-xs text-zinc-400">{a.subtitle}</div>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(a.at).toLocaleString("es-PE")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="text-sm font-medium">Acciones rápidas</div>
          <div className="mt-3 space-y-2">
            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm hover:opacity-90"
              href="/products"
            >
              Ver productos →
            </a>

            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm hover:opacity-90"
              href="/movements/new"
            >
              Registrar movimiento →
            </a>

            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm hover:opacity-90"
              href="/movements/history"
            >
              Ver historial →
            </a>

            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm hover:opacity-90"
              href="/users"
            >
              Ver usuarios →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}