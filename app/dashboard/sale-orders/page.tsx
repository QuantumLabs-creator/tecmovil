"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getSaleOrdersApi,
  type SaleOrder,
  type SaleOrderStatus,
} from "@/src/lib/api/sale-orders";

function getStatusLabel(status: SaleOrderStatus) {
  switch (status) {
    case "PENDING_REQUEST": return "Pendiente";
    case "APPROVED": return "Aprobado";
    case "PREPARING": return "En preparación";
    case "READY": return "Listo";
    case "COMPLETED": return "Completado";
    case "CANCELLED": return "Cancelado";
    case "REJECTED": return "Rechazado";
    default: return status;
  }
}

function getStatusClasses(status: SaleOrderStatus) {
  switch (status) {
    case "PENDING_REQUEST": return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
    case "APPROVED": return "bg-sky-100 text-sky-800 ring-1 ring-sky-200";
    case "PREPARING": return "bg-violet-100 text-violet-800 ring-1 ring-violet-200";
    case "READY": return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    case "COMPLETED": return "bg-green-100 text-green-800 ring-1 ring-green-200";
    case "CANCELLED": return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
    case "REJECTED": return "bg-red-100 text-red-800 ring-1 ring-red-200";
    default: return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
}

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2
  }).format(n);
}

export default function DashboardSaleOrdersPage() {
  const [items, setItems] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"" | SaleOrderStatus>("");
  const [search, setSearch] = useState("");

  async function loadOrders() {
    setLoading(true);
    try {
      const result = await getSaleOrdersApi({
        status: status || undefined,
        q: search.trim() || undefined,
        page: 1,
        pageSize: 30,
      });
      setItems(result.data?.items ?? []);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudieron cargar los pedidos",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadOrders();
    }, 300);

    return () => clearTimeout(debounce);
  }, [status, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pedidos de Venta</h1>
          <p className="text-sm text-gray-600">
            Revisa solicitudes, aprueba pedidos y gestiona su avance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Barra de búsqueda */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por pedido, cliente..."
              className="w-64 rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | SaleOrderStatus)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING_REQUEST">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="PREPARING">En preparación</option>
            <option value="READY">Listos</option>
            <option value="COMPLETED">Completados</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="REJECTED">Rechazados</option>
          </select>

          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            title="Recargar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendientes</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">
            {items.filter((o) => o.status === "PENDING_REQUEST").length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aprobados</div>
          <div className="mt-1 text-2xl font-bold text-sky-700">
            {items.filter((o) => o.status === "APPROVED").length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">En Proceso</div>
          <div className="mt-1 text-2xl font-bold text-violet-700">
            {items.filter((o) => ["PREPARING", "READY"].includes(o.status)).length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completados</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            {items.filter((o) => o.status === "COMPLETED").length}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-32 rounded-lg bg-gray-200"></div>
                <div className="h-10 w-40 rounded-lg bg-gray-100"></div>
                <div className="h-10 w-24 rounded-lg bg-gray-100"></div>
                <div className="h-6 w-20 rounded-full bg-gray-100"></div>
                <div className="ml-auto h-10 w-24 rounded-lg bg-gray-100"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {search || status ? "No se encontraron pedidos" : "No hay pedidos"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {search || status 
                ? "Intenta con otros filtros o términos de búsqueda" 
                : "Los pedidos que recibas aparecerán aquí"
              }
            </p>
            {(search || status) && (
              <button
                onClick={() => { setSearch(""); setStatus(""); }}
                className="mt-4 text-sm text-gray-600 hover:text-gray-900"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Pedido</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-center">Items</th>
                  <th className="px-6 py-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((order) => {
                  const customerName = order.user?.name || order.customer?.name || "Sin cliente";
                  const customerEmail = order.user?.email || order.customer?.email || "—";

                  return (
                    <tr key={order.id} className="group transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {order.customerType === "WHOLESALE" ? "Mayorista" : "Minorista"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900">{customerName}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{customerEmail}</div>
                      </td>

                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {new Date(order.orderDate).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            getStatusClasses(order.status),
                          ].join(" ")}
                        >
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">
                        {formatMoney(order.total)}
                      </td>

                      <td className="px-6 py-4 text-center text-gray-600">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                          {order.details.length}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/sale-orders/${order.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}