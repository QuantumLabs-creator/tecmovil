// src/components/users/columns.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "./types";
import { Pencil, Trash2 } from "lucide-react";

function getRoleBadge(role: string) {
  const styles: Record<string, string> = {
    ADMIN: "bg-indigo-100 text-indigo-700 border-indigo-300",
    USER: "bg-zinc-100 text-zinc-700 border-zinc-300",
    WAREHOUSE: "bg-amber-100 text-amber-700 border-amber-300",
    SELLER: "bg-sky-100 text-sky-700 border-sky-300",
  };

  return styles[role] ?? "bg-zinc-100 text-zinc-700 border-zinc-300";
}

export function getUserColumns(opts: {
  onEdit: (u: User) => void;
  onDelete: (id: string) => void;
}): ColumnDef<User>[] {
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
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ getValue }) => {
        const v = String(getValue() ?? "").trim();
        return <span>{v || "—"}</span>;
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ getValue }) => {
        const v = String(getValue() ?? "").toUpperCase();

        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${getRoleBadge(v)}`}
          >
            {v}
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
            title="Editar usuario"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            onClick={() => opts.onDelete(row.original.id)}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs hover:bg-[var(--color-muted)]"
            title="Desactivar usuario"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];
}