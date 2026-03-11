"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    getMySaleOrdersApi,
    type SaleOrder,
    type SaleOrderStatus,
} from "@/src/lib/api/sale-orders";

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

function getStatusClasses(status: SaleOrderStatus) {
    switch (status) {
        case "PENDING_REQUEST":
            return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20";
        case "APPROVED":
            return "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20";
        case "PREPARING":
            return "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20";
        case "READY":
            return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20";
        case "COMPLETED":
            return "bg-green-500/10 text-green-400 ring-1 ring-green-500/20";
        case "CANCELLED":
            return "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20";
        case "REJECTED":
            return "bg-red-500/10 text-red-400 ring-1 ring-red-500/20";
        default:
            return "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20";
    }
}

function formatMoney(value: string) {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
    }).format(n);
}

export default function MyOrdersPage() {
    const [items, setItems] = useState<SaleOrder[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadOrders() {
        setLoading(true);
        try {
            const result = await getMySaleOrdersApi({
                page: 1,
                pageSize: 20,
            });

            setItems(result.items);
        } catch (e: any) {
            toast.error("Error", {
                description: e?.error || e?.message || "No se pudieron cargar tus pedidos",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    const hasOrders = useMemo(() => (items?.length ?? 0) > 0, [items]);

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Mis pedidos</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Revisa el estado de tus pedidos y consulta su detalle.
                    </p>
                </div>

                <Link
                    href="/"
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:opacity-90"
                >
                    Ir al catálogo
                </Link>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
                {loading ? (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-zinc-300">
                        Cargando pedidos...
                    </div>
                ) : !hasOrders ? (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-6 text-sm text-zinc-300">
                        <div className="font-medium">Aún no tienes pedidos.</div>
                        <p className="mt-1 text-zinc-400">
                            Cuando generes uno, lo verás listado aquí.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-left text-zinc-400">
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="px-3 py-3 font-medium">Pedido</th>
                                    <th className="px-3 py-3 font-medium">Fecha</th>
                                    <th className="px-3 py-3 font-medium">Estado</th>
                                    <th className="px-3 py-3 font-medium">Total</th>
                                    <th className="px-3 py-3 font-medium">Items</th>
                                    <th className="px-3 py-3 font-medium text-right">Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-[var(--color-border)] last:border-b-0"
                                    >
                                        <td className="px-3 py-4">
                                            <div className="font-medium">{order.orderNumber}</div>
                                            <div className="mt-0.5 text-xs text-zinc-500">
                                                {order.customerType === "WHOLESALE" ? "Mayorista" : "Minorista"}
                                            </div>
                                        </td>

                                        <td className="px-3 py-4 text-zinc-300">
                                            {new Date(order.orderDate).toLocaleString("es-PE")}
                                        </td>

                                        <td className="px-3 py-4">
                                            <span
                                                className={[
                                                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                                                    getStatusClasses(order.status),
                                                ].join(" ")}
                                            >
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>

                                        <td className="px-3 py-4 font-medium">
                                            {formatMoney(order.total)}
                                        </td>

                                        <td className="px-3 py-4 text-zinc-300">
                                            {order.details.length}
                                        </td>

                                        <td className="px-3 py-4 text-right">
                                            <Link
                                                href={`/my-orders/${order.id}`}
                                                className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm hover:opacity-90"
                                            >
                                                Ver detalle
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}