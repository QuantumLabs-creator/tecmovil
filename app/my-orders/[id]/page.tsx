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
    case "PENDING_REQUEST":
      return "Pendiente";
    case "APPROVED":
      return "Aprobado";
    case "PREPARING":
      return "En preparación";
    case "READY":
      return "Listo";
    case "COMPLETED":
      return "Completado";
    case "CANCELLED":
      return "Cancelado";
    case "REJECTED":
      return "Rechazado";
    default:
      return status;
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
      setOrder(result);
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

      const updated = await cancelSaleOrderApi(order.id, {
        reason,
      });

      setOrder(updated);

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
      <div className="text-sm text-zinc-400">
        Cargando pedido...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-sm text-red-400">
        Pedido no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Pedido {order.orderNumber}
          </h1>

          <p className="text-sm text-zinc-400 mt-1">
            {new Date(order.orderDate).toLocaleString("es-PE")}
          </p>
        </div>

        <Link
          href="/my-orders"
          className="text-sm text-blue-400 hover:underline"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-800 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Estado</span>
          <span className="font-medium">
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Tipo cliente</span>
          <span>
            {order.customerType === "WHOLESALE" ? "Mayorista" : "Minorista"}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Total</span>
          <span className="font-semibold">
            {formatMoney(order.total)}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-left">Cantidad</th>
              <th className="p-3 text-left">Precio</th>
              <th className="p-3 text-left">Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {order.details.map((item) => (
              <tr key={item.id} className="border-b border-zinc-800">
                <td className="p-3">
                  {item.product.name}
                </td>

                <td className="p-3">
                  {item.quantity}
                </td>

                <td className="p-3">
                  {formatMoney(item.unitPrice)}
                </td>

                <td className="p-3">
                  {formatMoney(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.observations && (
        <div className="text-sm text-zinc-400">
          Observaciones: {order.observations}
        </div>
      )}

      {canCancel(order.status) && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          Cancelar pedido
        </button>
      )}

    </div>
  );
}