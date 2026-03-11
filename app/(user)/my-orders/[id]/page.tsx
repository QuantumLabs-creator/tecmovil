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
  type ReceiptType,
} from "@/src/lib/api/receipts";

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

function getReceiptTypeLabel(type: ReceiptType) {
  switch (type) {
    case "INVOICE": return "Factura";
    case "PAYMENT_PROOF": return "Comprobante de Pago";
    case "DELIVERY_PROOF": return "Comprobante de Entrega";
    case "OTHER": return "Otro";
    default: return type;
  }
}

function getReceiptTypeIcon(type: ReceiptType) {
  switch (type) {
    case "INVOICE":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "PAYMENT_PROOF":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "DELIVERY_PROOF":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
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
    const type = formData.get("type") as ReceiptType;

    if (!file || !type) {
      toast.error("Error", { description: "Selecciona un archivo y tipo de comprobante" });
      return;
    }

    try {
      setUploading(true);

      // Aquí deberías subir el archivo a tu storage y obtener la URL
      // Esto es un ejemplo - adapta según tu implementación real
      const uploadResult = await uploadFileToStorage(file);
      
      await createReceiptApi({
        type,
        fileUrl: uploadResult.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        saleOrderId: order.id,
      });

      toast.success("Comprobante subido correctamente");
      setShowUploadModal(false);
      await loadReceipts();
      e.currentTarget.reset();
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || "No se pudo subir el comprobante",
      });
    } finally {
      setUploading(false);
    }
  }

  // Función placeholder - implementa según tu storage (S3, Cloudinary, etc.)
  async function uploadFileToStorage(file: File): Promise<{ url: string }> {
    // Ejemplo: subir a tu API que maneja el storage
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Error al subir archivo");
    }

    return response.json();
  }

  async function handleDeleteReceipt(receiptId: string) {
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
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Comprobantes</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">{receipts.length} archivo(s)</div>
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

      {/* Receipts Section */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Comprobantes</h3>
            <p className="text-sm text-gray-600 mt-0.5">Sube facturas, comprobantes de pago o entrega</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-gray-800 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Subir comprobante
          </button>
        </div>

        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No hay comprobantes</p>
            <p className="text-sm text-gray-600 mt-1">Sube tus comprobantes para agilizar la aprobación</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    {getReceiptTypeIcon(receipt.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{receipt.fileName}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {getReceiptTypeLabel(receipt.type)}
                      </span>
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
                    Descargar
                  </a>
                  <button
                    onClick={() => handleDeleteReceipt(receipt.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Subir Comprobante</h3>
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
                  Tipo de comprobante
                </label>
                <select
                  name="type"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="INVOICE">Factura</option>
                  <option value="PAYMENT_PROOF">Comprobante de Pago</option>
                  <option value="DELIVERY_PROOF">Comprobante de Entrega</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo
                </label>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                  <input
                    type="file"
                    name="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Haz clic para subir</span> o arrastra
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG (max. 10MB)</p>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
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
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : "Subir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}