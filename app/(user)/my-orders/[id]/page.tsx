"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import {
  getSaleOrderByIdApi,
  cancelSaleOrderApi,
  type SaleOrder,
  type SaleOrderStatus,
} from "@/src/lib/api/sale-orders";

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(n);
}

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
    case "PENDING_REQUEST": return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "APPROVED": return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
    case "PREPARING": return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
    case "READY": return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case "COMPLETED": return "bg-green-100 text-green-700 ring-1 ring-green-200";
    case "CANCELLED": return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
    case "REJECTED": return "bg-red-100 text-red-700 ring-1 ring-red-200";
    default: return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  }
}

function canCancel(status: SaleOrderStatus) {
  return status === "PENDING_REQUEST";
}

export default function MyOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  async function loadOrder() {
    setLoading(true);
    try {
      const result = await getSaleOrderByIdApi(id);
      setOrder(result.data ?? null);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudo cargar el pedido",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    const reason = prompt("Motivo de cancelación:");
    if (!reason) return;

    try {
      setCancelling(true);
      const updated = await cancelSaleOrderApi(order.id, { reason });
      setOrder(updated.data ?? null);
      toast.success("Pedido cancelado");
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudo cancelar el pedido",
      });
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-gray-500">Cargando pedido...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">Pedido no encontrado</h3>
        <p className="mt-1 text-sm text-gray-600">El pedido que buscas no existe o fue eliminado.</p>
        <Link href="/my-orders" className="mt-4 text-sm font-medium text-gray-700 hover:text-gray-900">
          ← Volver a mis pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Pedido {order.orderNumber}</h1>
            <span className={[
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              getStatusClasses(order.status),
            ].join(" ")}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(order.orderDate).toLocaleString("es-PE", { 
              dateStyle: 'medium', 
              timeStyle: 'short' 
            })}
          </p>
        </div>

        <Link
          href="/my-orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      </div>

      {/* Order Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{getStatusLabel(order.status)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de cliente</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">
            {order.customerType === "WHOLESALE" ? "Mayorista" : "Minorista"}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</div>
          <div className="mt-1 text-lg font-bold text-gray-900">{formatMoney(order.total)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Items</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{order.details.length} productos</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Detalle del pedido</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Producto</th>
                <th className="px-6 py-3 text-left font-semibold">Cantidad</th>
                <th className="px-6 py-3 text-right font-semibold">Precio</th>
                <th className="px-6 py-3 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.details.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.product.name}</div>
                    {item.product.code && (
                      <div className="text-xs text-gray-500 font-mono">{item.product.code}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-gray-700">{formatMoney(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">
                    {formatMoney(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-600">Total</td>
                <td className="px-6 py-4 text-right text-lg font-bold text-gray-900 tabular-nums">
                  {formatMoney(order.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Observations */}
      {order.observations && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Observaciones</div>
          <p className="text-sm text-gray-700">{order.observations}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {canCancel(order.status) && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Cancelar pedido
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}