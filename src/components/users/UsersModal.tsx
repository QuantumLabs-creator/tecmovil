// src/components/users/UsersModal.tsx
"use client";

import { useEffect, useState } from "react";
import type { UserDraft, UserRole } from "./types";
import { emptyUserDraft } from "./types";

export default function UsersModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<UserDraft>;
  onClose: () => void;
  onSubmit: (draft: UserDraft) => void;
}) {
  const [draft, setDraft] = useState<UserDraft>(emptyUserDraft);

  useEffect(() => {
    if (!open) return;

    const merged: UserDraft = {
      ...emptyUserDraft,
      ...(initial ?? {}),
      name: String((initial as any)?.name ?? emptyUserDraft.name ?? ""),
      email: String((initial as any)?.email ?? emptyUserDraft.email ?? ""),
      role: ((initial as any)?.role ?? emptyUserDraft.role) as UserRole,
      active: Boolean((initial as any)?.active ?? emptyUserDraft.active),
      phone: String((initial as any)?.phone ?? emptyUserDraft.phone ?? ""),
      password:
        mode === "edit"
          ? ""
          : String((initial as any)?.password ?? emptyUserDraft.password ?? ""),
    };

    setDraft(merged);
  }, [open, initial, mode]);

  if (!open) return null;

  const title = mode === "create" ? "Nuevo usuario" : "Editar usuario";
  const saveLabel = mode === "create" ? "Crear" : "Guardar";

  function save() {
    const name = String(draft.name ?? "").trim();
    const email = String(draft.email ?? "").trim();
    const phone = String(draft.phone ?? "").trim();

    if (!name || !email) {
      alert("Completa al menos: Nombre y Email.");
      return;
    }

    if (mode === "create") {
      const pass = String(draft.password ?? "").trim();
      if (pass.length < 6) {
        alert("La contraseña debe tener mínimo 6 caracteres.");
        return;
      }
    }

    onSubmit({
      ...draft,
      name,
      email,
      phone,
      password: mode === "edit" ? String(draft.password ?? "") : draft.password,
    });
  }

  const inputCls =
    "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10";

  const sectionTitleCls = "text-sm font-semibold";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
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
          <div className="space-y-1">
            <div className={sectionTitleCls}>Datos del usuario</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input
                className={inputCls}
                value={draft.name ?? ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
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

            <Field label="Rol">
              <select
                className={inputCls}
                value={draft.role}
                onChange={(e) =>
                  setDraft({ ...draft, role: e.target.value as UserRole })
                }
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="WAREHOUSE">WAREHOUSE</option>
                <option value="SELLER">SELLER</option>
              </select>
            </Field>

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

            {mode === "create" ? (
              <Field label="Contraseña">
                <input
                  type="password"
                  className={inputCls}
                  value={draft.password ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, password: e.target.value })
                  }
                />
              </Field>
            ) : (
              <Field label="Contraseña (opcional)">
                <input
                  type="password"
                  className={inputCls}
                  value={draft.password ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, password: e.target.value })
                  }
                  placeholder="Dejar vacío para no cambiar"
                />
              </Field>
            )}
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