"use client";

import { useEffect, useState } from "react";
import type { SupplierDraft } from "./types";
import { emptySupplierDraft } from "./types";

export default function SuppliersModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<SupplierDraft>;
  onClose: () => void;
  onSubmit: (draft: SupplierDraft) => void;
}) {
  const [draft, setDraft] = useState<SupplierDraft>(emptySupplierDraft);

  useEffect(() => {
    if (!open) return;

    const merged: SupplierDraft = {
      ...emptySupplierDraft,
      ...(initial ?? {}),
      name: String((initial as any)?.name ?? emptySupplierDraft.name ?? ""),
      contact: String((initial as any)?.contact ?? emptySupplierDraft.contact ?? ""),
      email: String((initial as any)?.email ?? emptySupplierDraft.email ?? ""),
      phone: String((initial as any)?.phone ?? emptySupplierDraft.phone ?? ""),
      address: String((initial as any)?.address ?? emptySupplierDraft.address ?? ""),
      active: Boolean((initial as any)?.active ?? emptySupplierDraft.active),
    };

    setDraft(merged);
  }, [open, initial]);

  if (!open) return null;

  const title = mode === "create" ? "Nuevo proveedor" : "Editar proveedor";
  const saveLabel = mode === "create" ? "Crear" : "Guardar";

  function save() {
    const name = String(draft.name ?? "").trim();
    const contact = String(draft.contact ?? "").trim();
    const email = String(draft.email ?? "").trim();
    const phone = String(draft.phone ?? "").trim();
    const address = String(draft.address ?? "").trim();

    if (!name) {
      alert("El nombre es obligatorio.");
      return;
    }

    onSubmit({
      ...draft,
      name,
      contact,
      email,
      phone,
      address,
    });
  }

  const inputCls =
    "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70dvh] space-y-6 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input
                className={inputCls}
                value={draft.name ?? ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>

            <Field label="Contacto">
              <input
                className={inputCls}
                value={draft.contact ?? ""}
                onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                className={inputCls}
                value={draft.email ?? ""}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </Field>

            <Field label="Teléfono">
              <input
                className={inputCls}
                value={draft.phone ?? ""}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Dirección">
                <textarea
                  className={`${inputCls} min-h-24 resize-none`}
                  value={draft.address ?? ""}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Estado">
              <select
                className={inputCls}
                value={draft.active ? "true" : "false"}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.value === "true" })
                }
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-2 text-sm font-medium hover:opacity-80"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-medium opacity-80">{label}</div>
      {children}
    </label>
  );
}