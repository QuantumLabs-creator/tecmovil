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
import {
  getReceiptsApi,
  createReceiptApi,
  deleteReceiptApi,
  type Receipt,
} from "@/src/lib/api/receipts";
import { uploadFileApi } from "@/src/lib/api/upload";

// --- Utilidades ---

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

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ✅ NUEVA FUNCIÓN: Determina si se puede eliminar el comprobante según el estado
function canDeleteReceipt(status: SaleOrderStatus): boolean {
  // Solo se puede eliminar si el pedido aún está pendiente
  // Una vez aprobado o en proceso, el comprobante queda bloqueado
  return status === "PENDING_REQUEST" || status === "REJECTED" || status === "CANCELLED";
}

export default function MyOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  async function loadOrder() {
    setLoading(true);
    try {
      const result = await getSaleOrderByIdApi(id);
      setOrder(result.data ?? null);
      await loadReceipts();
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudo cargar el pedido",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadReceipts() {
    try {
      const result = await getReceiptsApi({
        saleOrderId: id,
        deleted: false,
        page: 1,
        pageSize: 50,
      });
      setReceipts(result.data?.items ?? []);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudieron cargar los comprobantes",
      });
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

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!order) return;

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file) {
      toast.error("Error", { description: "Selecciona un archivo" });
      return;
    }

    try {
      setUploading(true);

      const uploadResult = await uploadFileToStorage(file);

      await createReceiptApi({
        type: "PAYMENT_PROOF",
        fileUrl: uploadResult.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        saleOrderId: order.id,
      });

      e.currentTarget?.reset();
      setShowUploadModal(false);
      await loadReceipts();
      toast.success("Comprobante de pago subido correctamente");
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo subir el comprobante",
      });
    } finally {
      setUploading(false);
    }
  }

  async function uploadFileToStorage(file: File): Promise<{ url: string }> {
    const result = await uploadFileApi(file);
    return {
      url: result.data.url,
    };
  }

  async function handleDeleteReceipt(receiptId: string) {
    // ✅ VALIDACIÓN: No permitir eliminar si el pedido ya fue aprobado
    if (order && !canDeleteReceipt(order.status)) {
      toast.error("No se puede eliminar", {
        description: "El comprobante está bloqueado porque el pedido ya fue aprobado o está en proceso.",
      });
      return;
    }

    if (!confirm("¿Estás seguro de eliminar este comprobante?")) return;

    const reason = prompt("Motivo de eliminación (opcional):") || null;

    try {
      await deleteReceiptApi(receiptId, { reason });
      toast.success("Comprobante eliminado");
      await loadReceipts();
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudo eliminar el comprobante",
      });
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

  const hasPaymentProof = receipts.length > 0;
  const isReceiptLocked = order ? !canDeleteReceipt(order.status) : false;

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

      {/* Alerta si no hay comprobante */}
      {!hasPaymentProof && order.status === "PENDING_REQUEST" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-900">Falta comprobante de pago</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Sube una imagen del voucher o transferencia para que podamos aprobar tu pedido.
            </p>
          </div>
        </div>
      )}

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
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Comprobante</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">
            {hasPaymentProof ? (
              <span className="text-emerald-700">✓ Subido</span>
            ) : (
              <span className="text-amber-700">⚠ Pendiente</span>
            )}
          </div>
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

      {/* Receipts Section - SOLO COMPROBANTE DE PAGO */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Comprobante de Pago</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Sube una foto del voucher, transferencia Yape/Plin o depósito bancario
            </p>
          </div>
          {!hasPaymentProof && order.status === "PENDING_REQUEST" && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Subir comprobante
            </button>
          )}
        </div>

        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Sin comprobante de pago</p>
            <p className="text-sm text-gray-600 mt-1">Sube el voucher para confirmar tu pago</p>
            {order.status === "PENDING_REQUEST" && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Subir ahora
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{receipt.fileName}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Comprobante de Pago
                      </span>
                      {/* ✅ Badge de estado del comprobante */}
                      {isReceiptLocked && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Bloqueado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatFileSize(receipt.fileSize)} • Subido el {new Date(receipt.uploadedAt).toLocaleDateString("es-PE")}
                      {receipt.uploadedBy && ` por ${receipt.uploadedBy.name}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={receipt.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Ver
                  </a>
                  
                  {/* ✅ Botón Eliminar con lógica de bloqueo */}
                  {canDeleteReceipt(order.status) ? (
                    <button
                      onClick={() => handleDeleteReceipt(receipt.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed"
                      title="El comprobante no se puede eliminar porque el pedido ya fue aprobado o está en proceso"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Bloqueado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* ✅ Nota informativa cuando el comprobante está bloqueado */}
        {isReceiptLocked && hasPaymentProof && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            El comprobante está bloqueado porque el pedido ya fue {getStatusLabel(order.status).toLowerCase()}. 
            Si necesitas cambiarlo, contacta con soporte.
          </div>
        )}
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

      {/* Upload Modal - SOLO PAGO */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Subir Comprobante de Pago</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Sube una foto del voucher o captura de transferencia
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo
                </label>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <input
                    type="file"
                    name="file"
                    required
                    accept="image/*,.pdf"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer block"
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-3 text-sm text-gray-600">
                      <span className="font-medium text-emerald-700">Haz clic para subir</span> o arrastra
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG o PDF (max. 5MB)
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Asegúrate que se vea claramente el monto y la fecha
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : "Subir comprobante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}