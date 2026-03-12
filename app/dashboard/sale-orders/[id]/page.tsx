// app/(admin)/dashboard/sale-orders/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getSaleOrderByIdApi,
  approveSaleOrderApi,
  rejectSaleOrderApi,
  cancelSaleOrderApi,
  setSaleOrderStatusApi,
  type SaleOrder,
  type SaleOrderStatus,
} from "@/src/lib/api/sale-orders";
import {
  getReceiptsApi,
  deleteReceiptApi,
  type Receipt,
} from "@/src/lib/api/receipts";

// ─────────────────────────────────────────────────────────────
// Helpers de formato y UI
// ─────────────────────────────────────────────────────────────

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusLabel(status: SaleOrderStatus) {
  const labels: Record<SaleOrderStatus, string> = {
    PENDING_REQUEST: "Pendiente",
    APPROVED: "Aprobado",
    PREPARING: "En preparación",
    READY: "Listo para envío",
    COMPLETED: "Entregado",
    CANCELLED: "Cancelado",
    REJECTED: "Rechazado",
  };
  return labels[status] ?? status;
}

function getStatusClasses(status: SaleOrderStatus) {
  const classes: Record<SaleOrderStatus, string> = {
    PENDING_REQUEST: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    APPROVED: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
    PREPARING: "bg-violet-100 text-violet-800 ring-1 ring-violet-200",
    READY: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    COMPLETED: "bg-green-100 text-green-800 ring-1 ring-green-200",
    CANCELLED: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    REJECTED: "bg-red-100 text-red-800 ring-1 ring-red-200",
  };
  return classes[status] ?? "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
}

function getReceiptTypeIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─────────────────────────────────────────────────────────────
// Configuración de transiciones de estado
// ─────────────────────────────────────────────────────────────

const STATUS_FLOW: Record<SaleOrderStatus, SaleOrderStatus[]> = {
  PENDING_REQUEST: ["APPROVED", "REJECTED"],
  APPROVED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

const STATUS_LABELS: Record<SaleOrderStatus, string> = {
  PENDING_REQUEST: "Pendiente",
  APPROVED: "Aprobado",
  PREPARING: "En preparación",
  READY: "Listo para envío",
  COMPLETED: "Entregado",
  CANCELLED: "Cancelado",
  REJECTED: "Rechazado",
};

// ─────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────

export default function DashboardSaleOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null);

  // Cargar pedido y comprobantes
  async function loadData() {
    setLoading(true);
    try {
      const [orderResult, receiptsResult] = await Promise.all([
        getSaleOrderByIdApi(id),
        getReceiptsApi({ saleOrderId: id, deleted: false, page: 1, pageSize: 50 }),
      ]);
      setOrder(orderResult.data ?? null);
      setReceipts(receiptsResult.data?.items ?? []);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudo cargar la información",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  // Actualizar estado del pedido (función genérica)
  async function handleUpdateStatus(newStatus: SaleOrderStatus) {
    if (!order) return;
    if (!confirm(`¿Cambiar estado a "${STATUS_LABELS[newStatus]}"?`)) return;

    try {
      setUpdatingStatus(true);
      
      // Usar la función específica según el estado
      if (newStatus === "APPROVED") {
        await approveSaleOrderApi(order.id);
      } else if (newStatus === "REJECTED") {
        const reason = prompt("Motivo del rechazo (requerido):");
        if (!reason?.trim()) throw new Error("Motivo requerido");
        await rejectSaleOrderApi(order.id, { reason: reason.trim() });
      } else if (newStatus === "CANCELLED") {
        const reason = prompt("Motivo de cancelación (requerido):");
        if (!reason?.trim()) throw new Error("Motivo requerido");
        await cancelSaleOrderApi(order.id, { reason: reason.trim() });
      } else {
        // Para PREPARING, READY, COMPLETED usar setSaleOrderStatusApi
        await setSaleOrderStatusApi(order.id, { status: newStatus });
      }
      
      toast.success(`✅ Estado actualizado a ${STATUS_LABELS[newStatus]}`);
      await loadData();
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo actualizar el estado",
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  // Eliminar comprobante
  async function handleDeleteReceipt(receiptId: string) {
    if (!confirm("¿Eliminar este comprobante? Esta acción no se puede deshacer.")) return;
    const reason = prompt("Motivo de eliminación (opcional):") || undefined;

    try {
      setDeletingReceiptId(receiptId);
      await deleteReceiptApi(receiptId, { reason });
      toast.success("Comprobante eliminado");
      await loadData();
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudo eliminar el comprobante",
      });
    } finally {
      setDeletingReceiptId(null);
    }
  }

  // Helpers
  const nextStatuses = order ? STATUS_FLOW[order.status] : [];
  const isTerminalStatus = order ? nextStatuses.length === 0 : false;
  const hasPaymentProof = receipts.some((r) => r.type === "PAYMENT_PROOF");

  // ─────────────────────────────────────────────────────────
  // Estados de carga y error
  // ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="text-sm text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Pedido no encontrado</h3>
        <p className="mt-1 text-sm text-gray-600">El pedido que buscas no existe o fue eliminado.</p>
        <Link href="/dashboard/sale-orders" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-900">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a pedidos
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // UI Principal
  // ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Pedido {order.orderNumber}</h1>
            <span className={["inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", getStatusClasses(order.status)].join(" ")}>
              <span className="mr-2 h-2 w-2 rounded-full bg-current opacity-80" />
              {getStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Creado el {formatDate(order.orderDate)}
          </p>
        </div>

        <Link
          href="/dashboard/sale-orders"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      </div>

      {/* Timeline de estados */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4 text-center">Progreso del Pedido</h3>
  <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
    {(["PENDING_REQUEST", "APPROVED", "PREPARING", "READY", "COMPLETED"] as SaleOrderStatus[]).map((step, index, arr) => {
      const currentIndex = arr.indexOf(order.status);
      const isReached = arr.indexOf(order.status) >= index || ["CANCELLED", "REJECTED"].includes(order.status);
      const isCurrent = order.status === step;
      const isDisabled = ["CANCELLED", "REJECTED"].includes(order.status);
      const isCompleted = order.status === "COMPLETED";

      return (
        <div key={step} className="flex items-center flex-1 min-w-max">
          <div
            className={[
              "flex flex-col items-center gap-1.5",
              isDisabled ? "opacity-50" : "",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                isCurrent
                  ? isCompleted
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-gray-900 text-white ring-4 ring-gray-200"
                  : isReached
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              {index + 1}
            </div>
            <span className={["text-[10px]", isCurrent ? "font-medium text-gray-900" : "text-gray-500"].join(" ")}>
              {STATUS_LABELS[step]}
            </span>
          </div>
          {index < arr.length - 1 && (
            <div
              className={[
                "flex-1 h-px mx-1.5",
                arr.indexOf(order.status) > index || isCompleted ? "bg-emerald-600" : "bg-gray-200",
              ].join(" ")}
            />
          )}
        </div>
      );
    })}
  </div>
</div>

      {/* Alertas de comprobantes */}
      {order.status === "PENDING_REQUEST" && (
        !receipts.length ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-900">Sin comprobante de pago</p>
              <p className="text-sm text-red-700 mt-0.5">
                El cliente aún no ha subido el comprobante de pago. Espera antes de aprobar.
              </p>
            </div>
          </div>
        ) : !hasPaymentProof ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">Verifica el comprobante</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Asegúrate que el voucher coincida con el monto del pedido antes de aprobar.
              </p>
            </div>
          </div>
        ) : null
      )}

      {/* Grid de información */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: Detalles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info del cliente */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Información del Cliente</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="mt-1 font-medium text-gray-900">
                  {order.user?.name || order.customer?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Correo</p>
                <p className="mt-1 font-medium text-gray-900 break-all">
                  {order.user?.email || order.customer?.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tipo de cliente</p>
                <p className="mt-1 font-medium text-gray-900">
                  {order.customerType === "WHOLESALE" ? "Mayorista" : "Minorista"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">ID de usuario</p>
                <p className="mt-1 font-mono text-xs text-gray-700 break-all">
                  {order.userId || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de items */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Productos del Pedido</h3>
              <span className="text-sm text-gray-500">{order.details.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Producto</th>
                    <th className="px-6 py-3 text-left font-semibold">Código</th>
                    <th className="px-6 py-3 text-right font-semibold">Cantidad</th>
                    <th className="px-6 py-3 text-right font-semibold">Precio Unit.</th>
                    <th className="px-6 py-3 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.details.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{item.product.code}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{formatMoney(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">
                        {formatMoney(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-600">Total del pedido</td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-gray-900 tabular-nums">
                      {formatMoney(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          {order.observations && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Observaciones</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.observations}</p>
            </div>
          )}
        </div>

        {/* Columna derecha: Acciones y comprobantes */}
        <div className="space-y-6">
          {/* Panel de acciones de estado */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Acciones</h3>
            
            {isTerminalStatus ? (
              <div className="text-center py-4">
                <span className={["inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", getStatusClasses(order.status)].join(" ")}>
                  {getStatusLabel(order.status)}
                </span>
                <p className="text-sm text-gray-500 mt-2">Este pedido ya está finalizado</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Siguiente estado:</p>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => handleUpdateStatus(nextStatus)}
                      disabled={updatingStatus}
                      className={[
                        "flex-1 min-w-max rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                        nextStatus === "REJECTED" || nextStatus === "CANCELLED"
                          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : nextStatus === "APPROVED"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                        updatingStatus && "opacity-50 cursor-not-allowed",
                      ].join(" ")}
                    >
                      {updatingStatus ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Procesando...
                        </span>
                      ) : (
                        STATUS_LABELS[nextStatus]
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resumen financiero */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatMoney(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Impuestos</span>
                <span className="font-medium text-gray-900">Incluidos</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Sección de comprobantes */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Comprobante de Pago</h3>
              <p className="text-sm text-gray-600 mt-0.5">{receipts.length} archivo(s)</p>
            </div>

            {receipts.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">Sin archivos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
                          {getReceiptTypeIcon()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{receipt.fileName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatFileSize(receipt.fileSize)} • {new Date(receipt.uploadedAt).toLocaleDateString("es-PE")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={receipt.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          title="Ver archivo"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        <button
                          onClick={() => handleDeleteReceipt(receipt.id)}
                          disabled={deletingReceiptId === receipt.id}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingReceiptId === receipt.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}