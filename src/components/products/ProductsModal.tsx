"use client";

import { useEffect, useState } from "react";
import type { ProductDraft, ProductOption } from "./types";
import { emptyProductDraft } from "./types";

export default function ProductsModal({
  open,
  mode,
  initial,
  categories,
  suppliers,
  units,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<ProductDraft>;
  categories: ProductOption[];
  suppliers: ProductOption[];
  units: ProductOption[];
  onClose: () => void;
  onSubmit: (draft: ProductDraft) => void;
}) {
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft);

  useEffect(() => {
    if (!open) return;

    const merged: ProductDraft = {
      ...emptyProductDraft,
      ...(initial ?? {}),
      code: String((initial as any)?.code ?? emptyProductDraft.code ?? ""),
      name: String((initial as any)?.name ?? emptyProductDraft.name ?? ""),
      description: String((initial as any)?.description ?? emptyProductDraft.description ?? ""),
      image: String((initial as any)?.image ?? emptyProductDraft.image ?? ""),
      purchasePrice: String((initial as any)?.purchasePrice ?? emptyProductDraft.purchasePrice ?? ""),
      retailPrice: String((initial as any)?.retailPrice ?? emptyProductDraft.retailPrice ?? ""),
      wholesalePrice: String((initial as any)?.wholesalePrice ?? emptyProductDraft.wholesalePrice ?? ""),
      wholesaleMinQuantity: Number((initial as any)?.wholesaleMinQuantity ?? emptyProductDraft.wholesaleMinQuantity ?? 10),
      minSalePrice: String((initial as any)?.minSalePrice ?? emptyProductDraft.minSalePrice ?? ""),
      maxSalePrice: String((initial as any)?.maxSalePrice ?? emptyProductDraft.maxSalePrice ?? ""),
      minStock: Number((initial as any)?.minStock ?? emptyProductDraft.minStock ?? 0),
      currentStock: Number((initial as any)?.currentStock ?? emptyProductDraft.currentStock ?? 0),
      reservedStock: Number((initial as any)?.reservedStock ?? emptyProductDraft.reservedStock ?? 0),
      active: Boolean((initial as any)?.active ?? emptyProductDraft.active),
      categoryId: String((initial as any)?.categoryId ?? emptyProductDraft.categoryId ?? ""),
      supplierId: String((initial as any)?.supplierId ?? emptyProductDraft.supplierId ?? ""),
      unitId: String((initial as any)?.unitId ?? emptyProductDraft.unitId ?? ""),
    };

    setDraft(merged);
  }, [open, initial]);

  if (!open) return null;

  const title = mode === "create" ? "Nuevo producto" : "Editar producto";
  const saveLabel = mode === "create" ? "Crear" : "Guardar";

  function save() {
    const name = String(draft.name ?? "").trim();
    const categoryId = String(draft.categoryId ?? "").trim();
    const unitId = String(draft.unitId ?? "").trim();
    const purchasePrice = String(draft.purchasePrice ?? "").trim();
    const retailPrice = String(draft.retailPrice ?? "").trim();

    if (!name) {
      alert("El nombre es obligatorio.");
      return;
    }

    if (!categoryId) {
      alert("La categoría es obligatoria.");
      return;
    }

    if (!unitId) {
      alert("La unidad es obligatoria.");
      return;
    }

    if (!purchasePrice) {
      alert("El precio de compra es obligatorio.");
      return;
    }

    if (!retailPrice) {
      alert("El precio de venta es obligatorio.");
      return;
    }

    onSubmit({
      ...draft,
      code: String(draft.code ?? "").trim(),
      name,
      description: String(draft.description ?? "").trim(),
      image: String(draft.image ?? "").trim(),
      purchasePrice,
      retailPrice,
      wholesalePrice: String(draft.wholesalePrice ?? "").trim(),
      minSalePrice: String(draft.minSalePrice ?? "").trim(),
      maxSalePrice: String(draft.maxSalePrice ?? "").trim(),
      categoryId,
      supplierId: String(draft.supplierId ?? "").trim(),
      unitId,
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

      <div className="relative w-full max-w-5xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Código">
              <input
                className={inputCls}
                value={draft.code ?? ""}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                placeholder="Opcional"
              />
            </Field>

            <Field label="Nombre">
              <input
                className={inputCls}
                value={draft.name ?? ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
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

            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Descripción">
                <textarea
                  className={`${inputCls} min-h-24 resize-none`}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Imagen (URL)">
              <input
                className={inputCls}
                value={draft.image ?? ""}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              />
            </Field>

            <Field label="Categoría">
              <select
                className={inputCls}
                value={draft.categoryId ?? ""}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
              >
                <option value="">Selecciona</option>
                {categories.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Unidad">
              <select
                className={inputCls}
                value={draft.unitId ?? ""}
                onChange={(e) => setDraft({ ...draft, unitId: e.target.value })}
              >
                <option value="">Selecciona</option>
                {units.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                    {x.symbol ? ` (${x.symbol})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Proveedor">
              <select
                className={inputCls}
                value={draft.supplierId ?? ""}
                onChange={(e) => setDraft({ ...draft, supplierId: e.target.value })}
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Precio compra">
              <input
                className={inputCls}
                value={draft.purchasePrice ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, purchasePrice: e.target.value })
                }
              />
            </Field>

            <Field label="Precio venta">
              <input
                className={inputCls}
                value={draft.retailPrice ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, retailPrice: e.target.value })
                }
              />
            </Field>

            <Field label="Precio mayorista">
              <input
                className={inputCls}
                value={draft.wholesalePrice ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, wholesalePrice: e.target.value })
                }
              />
            </Field>

            <Field label="Cantidad mínima mayorista">
              <input
                type="number"
                className={inputCls}
                value={draft.wholesaleMinQuantity ?? 10}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    wholesaleMinQuantity: Number(e.target.value || 0),
                  })
                }
              />
            </Field>

            <Field label="Precio mínimo venta">
              <input
                className={inputCls}
                value={draft.minSalePrice ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, minSalePrice: e.target.value })
                }
              />
            </Field>

            <Field label="Precio máximo venta">
              <input
                className={inputCls}
                value={draft.maxSalePrice ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, maxSalePrice: e.target.value })
                }
              />
            </Field>

            <Field label="Stock mínimo">
              <input
                type="number"
                className={inputCls}
                value={draft.minStock ?? 0}
                onChange={(e) =>
                  setDraft({ ...draft, minStock: Number(e.target.value || 0) })
                }
              />
            </Field>

            <Field label="Stock actual">
              <input
                type="number"
                className={inputCls}
                value={draft.currentStock ?? 0}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    currentStock: Number(e.target.value || 0),
                  })
                }
              />
            </Field>

            <Field label="Stock reservado">
              <input
                type="number"
                className={inputCls}
                value={draft.reservedStock ?? 0}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    reservedStock: Number(e.target.value || 0),
                  })
                }
              />
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