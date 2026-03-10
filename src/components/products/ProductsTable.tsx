"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { Product } from "./types";
import { getProductColumns } from "./columns";

export default function ProductsTable({
  data,
  onCreate,
  onEdit,
  onDelete,
}: {
  data: Product[];
  onCreate: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => getProductColumns({ onEdit, onDelete }),
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar por código, nombre, categoría..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="text-sm opacity-70">
            {table.getRowModel().rows.length} resultado(s)
          </div>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium shadow-sm hover:bg-[var(--color-muted)]"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <div className="relative h-[calc(100dvh-259px)] overflow-x-auto overflow-y-auto">
            <table className="min-w-[1400px] w-full text-sm">
              <thead className="bg-[var(--color-muted)]">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="px-4 py-3 text-left text-xs font-semibold opacity-80"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center opacity-70"
                    >
                      No hay resultados.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-[var(--color-border)] hover:bg-[var(--color-muted)]/60"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}