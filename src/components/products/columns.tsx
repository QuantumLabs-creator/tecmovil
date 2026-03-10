"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Product } from "./types";
import { Pencil, Trash2 } from "lucide-react";

function money(value: string | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(n);
}

export function getProductColumns(opts: {
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}): ColumnDef<Product>[] {
  return [
    {
      id: "rowNumber",
      header: "#",
      size: 40,
      cell: ({ row }) => (
        <span className="opacity-70 tabular-nums">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ getValue }) => {
        const v = String(getValue() ?? "").trim();
        return <span className="font-medium">{v || "—"}</span>;
      },
    },
    {
      accessorKey: "name",
      header: "Producto",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs opacity-70">
            {row.original.description || "Sin descripción"}
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoría",
      cell: ({ row }) => <span>{row.original.category?.name || "—"}</span>,
    },
    {
      id: "supplier",
      header: "Proveedor",
      cell: ({ row }) => <span>{row.original.supplier?.name || "—"}</span>,
    },
    {
      id: "unit",
      header: "Unidad",
      cell: ({ row }) => {
        const unit = row.original.unit;
        if (!unit) return <span>—</span>;
        return (
          <span>
            {unit.name}
            {unit.symbol ? ` (${unit.symbol})` : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "retailPrice",
      header: "P. venta",
      cell: ({ getValue }) => <span>{money(String(getValue() ?? ""))}</span>,
    },
    {
      accessorKey: "currentStock",
      header: "Stock",
      cell: ({ row }) => {
        const current = Number(row.original.currentStock ?? 0);
        const min = Number(row.original.minStock ?? 0);
        const low = current <= min;

        return (
          <span
            className={
              low ? "font-medium text-amber-600" : "font-medium"
            }
          >
            {current}
          </span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Estado",
      cell: ({ getValue }) => {
        const active = Boolean(getValue());
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
              active
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-red-100 text-red-700 border-red-300"
            }`}
          >
            {active ? "Activo" : "Inactivo"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => opts.onEdit(row.original)}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs hover:bg-[var(--color-muted)]"
            title="Editar producto"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            onClick={() => opts.onDelete(row.original.id)}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs hover:bg-[var(--color-muted)]"
            title="Desactivar producto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];
}