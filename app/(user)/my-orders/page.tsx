"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    getMySaleOrdersApi,
    type SaleOrder,
    type SaleOrderStatus,
} from "@/src/lib/api/sale-orders";
import { getReceiptsApi } from "@/src/lib/api/receipts";


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

function formatMoney(value: string) {
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 2
    }).format(n);
}

export default function MyOrdersPage() {
    const [items, setItems] = useState<(SaleOrder & { receiptsCount?: number })[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadOrders() {
        setLoading(true);
        try {
            const result = await getMySaleOrdersApi({ page: 1, pageSize: 20 });
            const orders = result.data?.items ?? [];

            // Cargar cantidad de comprobantes para cada pedido
            const ordersWithReceipts = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const receiptsResult = await getReceiptsApi({
                            saleOrderId: order.id,
                            deleted: false,
                            page: 1,
                            pageSize: 1,
                        });
                        return {
                            ...order,
                            receiptsCount: receiptsResult.data?.meta?.total ?? 0,
                        };
                    } catch {
                        return { ...order, receiptsCount: 0 };
                    }
                })
            );

            setItems(ordersWithReceipts);
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mis Pedidos</h1>
                    <p className="text-sm text-gray-600 max-w-md">
                        Gestiona y revisa el estado de todas tus órdenes de compra en un solo lugar.
                    </p>
                </div>

                <Link
                    href="/shop"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                >
                    <span>Ir al catálogo</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>

            {/* Main Card */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                
                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-10 w-32 rounded-lg bg-gray-200"></div>
                                <div className="h-10 w-24 rounded-lg bg-gray-100"></div>
                                <div className="h-6 w-20 rounded-full bg-gray-100"></div>
                                <div className="ml-auto h-10 w-24 rounded-lg bg-gray-100"></div>
                            </div>
                        ))}
                    </div>
                ) : !hasOrders ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Aún no tienes pedidos</h3>
                        <p className="mt-1 max-w-sm text-sm text-gray-600">
                            Parece que aún no has realizado ninguna compra. Explora nuestro catálogo para comenzar.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Pedido</th>
                                    <th className="px-6 py-4 font-semibold">Fecha</th>
                                    <th className="px-6 py-4 font-semibold">Estado</th>
                                    <th className="px-6 py-4 font-semibold text-center">Comprobantes</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                                    <th className="px-6 py-4 font-semibold text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((order) => (
                                    <tr 
                                        key={order.id} 
                                        className="group transition-colors hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.orderNumber}</div>
                                            <div className="mt-0.5 text-xs text-gray-500">
                                                {order.customerType === "WHOLESALE" ? "Mayorista" : "Minorista"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                                            {new Date(order.orderDate).toLocaleDateString("es-PE", {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            })}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={[
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                getStatusClasses(order.status),
                                            ].join(" ")}>
                                                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {order.receiptsCount && order.receiptsCount > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {order.receiptsCount} archivo(s)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    Sin archivos
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right font-semibold text-gray-900 tabular-nums">
                                            {formatMoney(order.total)}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/my-orders/${order.id}`}
                                                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
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