"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getDashboardApi, type DashboardResponse } from "@/src/lib/api/dashboard";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);

    try {
      const result = await getDashboardApi();
      setData(result.data);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "Intenta nuevamente",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
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
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-900/20",
        border: "border-sky-200 dark:border-sky-800",
      },
      {
        title: "Movimientos (hoy)",
        value: k ? String(k.movimientos.hoy) : "—",
        hint: k
          ? `Mes: ${k.movimientos.mes} • ${k.mesActual.month}/${k.mesActual.year}`
          : "Entradas + salidas",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
      },
      {
        title: "Usuarios",
        value: k ? String(k.usuarios.total) : "—",
        hint: k ? `Admins: ${k.usuarios.admins}` : "Cuentas registradas",
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        border: "border-violet-200 dark:border-violet-800",
      },
      {
        title: "Periodo",
        value: k ? `${k.mesActual.month}/${k.mesActual.year}` : "—",
        hint: "Mes actual",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Vista general de la actividad del sistema.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className={`rounded-2xl border ${c.border} ${c.bg} p-4 shadow-sm transition-all hover:shadow-md`}
          >
            <div className={`text-sm font-medium ${c.color}`}>{c.title}</div>
            <div className={`mt-2 text-3xl font-semibold ${c.color}`}>
              {loading ? "—" : c.value}
            </div>
            <div className="mt-2 text-xs text-zinc-400">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="text-sm font-medium text-[var(--color-text)] mb-3">Actividad reciente</div>

          <div className="space-y-2 text-sm text-zinc-300">
            {loading ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
                Cargando actividad...
              </div>
            ) : !data || data.activity.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
                Aún no hay actividad para mostrar.
              </div>
            ) : (
              data.activity.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-[var(--color-text)] text-sm">{a.title}</div>
                      {a.subtitle ? (
                        <div className="mt-0.5 text-xs text-zinc-400">{a.subtitle}</div>
                      ) : null}
                    </div>

                    <div className="whitespace-nowrap text-xs text-zinc-400">
                      {new Date(a.at).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="text-sm font-medium text-[var(--color-text)]">Acciones rápidas</div>

          <div className="mt-3 space-y-2">
            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-xs hover:opacity-90 transition-colors"
              href="/dashboard/products"
            >
              Ver productos →
            </a>

            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-xs hover:opacity-90 transition-colors"
              href="/dashboard/movements/new"
            >
              Registrar movimiento →
            </a>

            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-xs hover:opacity-90 transition-colors"
              href="/dashboard/movements/history"
            >
              Ver historial →
            </a>

            <a
              className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-xs hover:opacity-90 transition-colors"
              href="/dashboard/users"
            >
              Ver usuarios →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}