"use client";

import { useEffect, useState } from "react";
import type { ProductDraft, ProductOption } from "./types";
import { emptyProductDraft } from "./types";
import { uploadFileApi } from "@/src/lib/api/upload";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

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
    setImagePreview(merged.image || "");
    setImageFile(null);
  }, [open, initial]);

  if (!open) return null;

  const title = mode === "create" ? "Nuevo producto" : "Editar producto";
  const saveLabel = mode === "create" ? "Crear" : "Guardar";

  async function handleImageUpload(file: File) {
    try {
      setUploading(true);
      const result = await uploadFileApi(file);
      const imageUrl = result.data.url;

      setDraft({ ...draft, image: imageUrl });
      setImagePreview(imageUrl);
      setImageFile(null);
    } catch (e: any) {
      alert("Error al subir imagen: " + (e?.error || e?.message || "Error desconocido"));
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten imágenes (JPG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar los 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setImageFile(file);
  }

  function removeImage() {
    setDraft({ ...draft, image: "" });
    setImagePreview("");
    setImageFile(null);
  }

  async function save() {
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

    try {
      let imageUrl = String(draft.image ?? "").trim();

      // Si hay archivo seleccionado y aún no se subió
      if (imageFile) {
        setUploading(true);
        const result = await uploadFileApi(imageFile);
        imageUrl = result.data.url;
      }

      onSubmit({
        ...draft,
        code: String(draft.code ?? "").trim(),
        name,
        description: String(draft.description ?? "").trim(),
        image: imageUrl,
        purchasePrice,
        retailPrice,
        wholesalePrice: String(draft.wholesalePrice ?? "").trim(),
        minSalePrice: String(draft.minSalePrice ?? "").trim(),
        maxSalePrice: String(draft.maxSalePrice ?? "").trim(),
        categoryId,
        supplierId: String(draft.supplierId ?? "").trim(),
        unitId,
      });
    } catch (e: any) {
      alert("Error al subir imagen: " + (e?.error || e?.message || "Error desconocido"));
    } finally {
      setUploading(false);
    }
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
          {/* Sección de imagen */}
          <div>
            <label className="text-xs font-medium opacity-80 mb-2 block">Imagen del producto</label>

            <label className="relative flex h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />

              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeImage();
                      }}
                      className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar imagen
                    </button>
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                        Subiendo...
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Subiendo imagen...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm font-medium text-gray-700">Haz clic para subir una imagen</p>
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF (max. 5MB)</p>
                    </>
                  )}
                </div>
              )}
            </label>

            {imageFile && !uploading && (
              <button
                type="button"
                onClick={() => handleImageUpload(imageFile)}
                className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-2 text-sm font-medium hover:opacity-80"
              >
                Subir imagen
              </button>
            )}
          </div>

          {/* Campos del formulario */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Descripción">
                <textarea
                  className={`${inputCls} min-h-24 resize-none`}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
            </div>

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
            disabled={uploading}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
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