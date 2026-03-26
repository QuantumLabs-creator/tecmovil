"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { ProductDraft, ProductOption, ProductStatus } from "./types";
import { emptyProductDraft } from "./types";
import { uploadFileApi } from "@/src/lib/api/upload";
import {
  getProductVariantsApi,
  createProductVariantApi,
  updateProductVariantApi,
  deleteProductVariantApi,
  type ProductVariant,
} from "@/src/lib/api/product-variants";

export type ProductRecommendationItem = {
  id: string;
  recommendedProductId: string;
  priority: number;
  recommendedProduct: {
    id: string;
    code: string;
    name: string;
  };
};

// ✅ Componente Combobox con búsqueda integrada
function ProductCombobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: ProductOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(searchLower));
  }, [options, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setSearch(selectedOption?.name ?? "");
    }
  }, [value, selectedOption]);

  const inputCls =
    "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10";

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          className={inputCls}
          value={isOpen ? search : selectedOption?.name ?? ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            onChange("");
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder ?? "Buscar..."}
          disabled={disabled}
        />
        <svg
          className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No se encontraron productos</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
                onClick={() => {
                  onChange(option.id);
                  setSearch(option.name);
                  setIsOpen(false);
                }}
              >
                {option.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductsModal({
  open,
  mode,
  productId,
  initial,
  categories,
  suppliers,
  units,
  productOptions,
  recommendations,
  onClose,
  onSubmit,
  onAddRecommendation,
  onRemoveRecommendation,
}: {
  open: boolean;
  mode: "create" | "edit";
  productId?: string | null;
  initial?: Partial<ProductDraft>;
  categories: ProductOption[];
  suppliers: ProductOption[];
  units: ProductOption[];
  productOptions: ProductOption[];
  recommendations?: ProductRecommendationItem[];
  onClose: () => void;
  onSubmit: (draft: ProductDraft) => void;
  onAddRecommendation?: (recommendedProductId: string, priority?: number) => Promise<void> | void;
  onRemoveRecommendation?: (recommendationId: string) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [selectedRecommendedId, setSelectedRecommendedId] = useState("");
  const [recommendationPriority, setRecommendationPriority] = useState(0);
  const [savingRecommendation, setSavingRecommendation] = useState(false);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantForm, setVariantForm] = useState<Partial<ProductVariant>>({
    color: "",
    size: "",
    retailPrice: "",
    currentStock: 0,
    reservedStock: 0,
    status: "ACTIVE",
  });
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);

  useEffect(() => {
    if (!open) return;

    const merged: ProductDraft = {
      ...emptyProductDraft,
      ...(initial ?? {}),
      code: String((initial as any)?.code ?? emptyProductDraft.code ?? ""),
      name: String((initial as any)?.name ?? emptyProductDraft.name ?? ""),
      description: (initial as any)?.description ?? null,
      image: (initial as any)?.image ?? null,

      purchasePrice: String((initial as any)?.purchasePrice ?? emptyProductDraft.purchasePrice ?? ""),
      retailPrice: String((initial as any)?.retailPrice ?? emptyProductDraft.retailPrice ?? ""),
      wholesalePrice: (initial as any)?.wholesalePrice ?? null,
      wholesaleMinQuantity: Number(
        (initial as any)?.wholesaleMinQuantity ?? emptyProductDraft.wholesaleMinQuantity ?? 10
      ),

      minSalePrice: (initial as any)?.minSalePrice ?? null,
      maxSalePrice: (initial as any)?.maxSalePrice ?? null,

      minStock: Number((initial as any)?.minStock ?? emptyProductDraft.minStock ?? 0),
      currentStock: Number((initial as any)?.currentStock ?? emptyProductDraft.currentStock ?? 0),
      reservedStock: Number((initial as any)?.reservedStock ?? emptyProductDraft.reservedStock ?? 0),

      pendingRequestedStock: Number(
        (initial as any)?.pendingRequestedStock ?? emptyProductDraft.pendingRequestedStock ?? 0
      ),
      availableRealStock: Number(
        (initial as any)?.availableRealStock ?? emptyProductDraft.availableRealStock ?? 0
      ),
      availableCommercialStock: Number(
        (initial as any)?.availableCommercialStock ?? emptyProductDraft.availableCommercialStock ?? 0
      ),

      hasVariants: Boolean((initial as any)?.hasVariants ?? emptyProductDraft.hasVariants ?? false),

      status: ((initial as any)?.status ?? emptyProductDraft.status ?? "ACTIVE") as ProductStatus,

      categoryId: String((initial as any)?.categoryId ?? emptyProductDraft.categoryId ?? ""),
      supplierId: (initial as any)?.supplierId ?? null,
      unitId: String((initial as any)?.unitId ?? emptyProductDraft.unitId ?? ""),
    };

    setDraft(merged);
    setImagePreview(merged.image || "");
    setImageFile(null);
    setSelectedRecommendedId("");
    setRecommendationPriority(0);
  }, [open, initial]);

  // 🔥 CARGAR VARIANTES CUANDO EL PRODUCTO TIENE hasVariants = true
  useEffect(() => {
    if (!open || !productId || !draft.hasVariants || mode !== "edit") return;

    async function loadVariants() {
      try {
        setLoadingVariants(true);
        const data = await getProductVariantsApi(productId as string);
        setVariants(data);
      } catch (e: any) {
        console.error("Error cargando variantes:", e);
        setVariants([]);
      } finally {
        setLoadingVariants(false);
      }
    }

    loadVariants();
  }, [open, productId, draft.hasVariants, mode]);

  const availableRecommendationOptions = useMemo(() => {
    const currentId = String(productId ?? "");
    const alreadyLinked = new Set(
      (recommendations ?? []).map((r) => String(r.recommendedProductId))
    );

    return productOptions.filter((p) => {
      if (!p.id) return false;
      if (p.id === currentId) return false;
      if (alreadyLinked.has(p.id)) return false;
      return true;
    });
  }, [productOptions, recommendations, productId]);

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
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setImageFile(file);
  }

  function removeImage() {
    setDraft({ ...draft, image: null });
    setImagePreview("");
    setImageFile(null);
  }

  // 🔥 FUNCIONES PARA GESTIONAR VARIANTES
  function handleAddVariant() {
    setVariantForm({
      color: "",
      size: "",
      sku: "",
      retailPrice: "",
      currentStock: 0,
      reservedStock: 0,
      status: "ACTIVE",
    });
    setEditingVariantId(null);
    setShowVariantForm(true);
  }

  function handleEditVariant(variant: ProductVariant) {
    setVariantForm({
      color: variant.color ?? "",
      size: variant.size ?? "",
      sku: variant.sku ?? "",
      retailPrice: variant.retailPrice ?? "",
      currentStock: variant.currentStock,
      reservedStock: variant.reservedStock,
      status: variant.status,
    });
    setEditingVariantId(variant.id);
    setShowVariantForm(true);
  }

  async function handleSaveVariant() {
    if (!productId) return;
  
    try {
      setSavingVariant(true);
      const payload = {
        color: variantForm.color?.trim() || null,
        size: variantForm.size?.trim() || null,
        retailPrice: String(variantForm.retailPrice).trim(),
        currentStock: Number(variantForm.currentStock) || 0,
        reservedStock: Number(variantForm.reservedStock) || 0,
        status: variantForm.status || "ACTIVE",
      };

      if (editingVariantId) {
        await updateProductVariantApi(editingVariantId, payload);
      } else {
        await createProductVariantApi(productId, payload);
      }

      // Recargar variantes
      const updated = await getProductVariantsApi(productId);
      setVariants(updated);

      // Reset form
      setVariantForm({
        color: "",
        size: "",
        sku: "",
        retailPrice: "",
        currentStock: 0,
        reservedStock: 0,
        status: "ACTIVE",
      });
      setEditingVariantId(null);
      setShowVariantForm(false);
    } catch (e: any) {
      alert("Error al guardar variante: " + (e?.error || e?.message || "Error desconocido"));
    } finally {
      setSavingVariant(false);
    }
  }

  async function handleDeleteVariant(id: string) {
    if (!confirm("¿Eliminar esta variante?")) return;
    if (!productId) return;

    try {
      setSavingVariant(true);
      await deleteProductVariantApi(id);
      const updated = await getProductVariantsApi(productId);
      setVariants(updated);
    } catch (e: any) {
      alert("Error al eliminar variante: " + (e?.error || e?.message || "Error desconocido"));
    } finally {
      setSavingVariant(false);
    }
  }

  function cancelVariantForm() {
    setVariantForm({
      color: "",
      size: "",
      sku: "",
      retailPrice: "",
      currentStock: 0,
      reservedStock: 0,
      status: "ACTIVE",
    });
    setEditingVariantId(null);
    setShowVariantForm(false);
  }

  async function save() {
  const name = String(draft.name ?? "").trim();
  const categoryId = String(draft.categoryId ?? "").trim();
  const unitId = String(draft.unitId ?? "").trim();

  // 🔥 VALIDACIONES BÁSICAS (siempre obligatorias)
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

  // 🔥 VALIDACIÓN DE PRECIOS — Solo si NO tiene variantes
  if (!draft.hasVariants) {
    const purchasePrice = String(draft.purchasePrice ?? "").trim();
    const retailPrice = String(draft.retailPrice ?? "").trim();

    if (!purchasePrice) {
      alert("El precio de compra es obligatorio.");
      return;
    }

    if (!retailPrice) {
      alert("El precio de venta es obligatorio.");
      return;
    }
  }

  // 🔥 VALIDACIÓN DE VARIANTES — Si tiene variantes, debe tener al menos una
  if (draft.hasVariants && mode === "edit" && productId && variants.length === 0) {
    alert("Debes crear al menos una variante antes de guardar.");
    return;
  }

  try {
    let imageUrl = String(draft.image ?? "").trim();

    if (imageFile) {
      setUploading(true);
      const result = await uploadFileApi(imageFile);
      imageUrl = result.data.url;
    }

    onSubmit({
      ...draft,
      code: String(draft.code ?? "").trim(),
      name,
      description: String(draft.description ?? "").trim() || null,
      image: imageUrl || null,
      purchasePrice: draft.hasVariants ? "0" : String(draft.purchasePrice ?? "").trim(),
      retailPrice: draft.hasVariants ? "0" : String(draft.retailPrice ?? "").trim(),
      wholesalePrice: draft.hasVariants ? null : String(draft.wholesalePrice ?? "").trim() || null,
      minSalePrice: draft.hasVariants ? null : String(draft.minSalePrice ?? "").trim() || null,
      maxSalePrice: draft.hasVariants ? null : String(draft.maxSalePrice ?? "").trim() || null,
      categoryId,
      supplierId: String(draft.supplierId ?? "").trim() || null,
      unitId,
      hasVariants: Boolean(draft.hasVariants),
    });
  } catch (e: any) {
    alert("Error al subir imagen: " + (e?.error || e?.message || "Error desconocido"));
  } finally {
    setUploading(false);
  }
}

  async function handleAddRecommendation() {
    if (!selectedRecommendedId || !onAddRecommendation || savingRecommendation) return;

    try {
      setSavingRecommendation(true);
      await onAddRecommendation(selectedRecommendedId, recommendationPriority);
      setSelectedRecommendedId("");
      setRecommendationPriority(0);
    } catch (e: any) {
      alert("Error al agregar recomendación: " + (e?.error || e?.message || "Error desconocido"));
    } finally {
      setSavingRecommendation(false);
    }
  }

  async function handleRemoveRecommendation(id: string) {
    if (!onRemoveRecommendation) return;

    try {
      setSavingRecommendation(true);
      await onRemoveRecommendation(id);
    } catch (e: any) {
      alert("Error al eliminar recomendación: " + (e?.error || e?.message || "Error desconocido"));
    } finally {
      setSavingRecommendation(false);
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
          {/* Imagen */}
          <div>
            <label className="mb-2 block text-xs font-medium opacity-80">Imagen del producto</label>
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
                  <img src={imagePreview} alt="Vista previa" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeImage();
                      }}
                      className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
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

          {/* Campos principales */}
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
                value={draft.status ?? "ACTIVE"}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as ProductStatus })}
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
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
                onChange={(e) => setDraft({ ...draft, supplierId: e.target.value || null })}
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

            {/* 🔥 PRECIOS CON DISABLED SI HAY VARIANTES */}
            <Field label="Precio compra">
              <input
                className={inputCls}
                value={draft.purchasePrice ?? ""}
                onChange={(e) => setDraft({ ...draft, purchasePrice: e.target.value })}
                disabled={draft.hasVariants}
              />
            </Field>

            <Field label="Precio venta">
              <input
                className={inputCls}
                value={draft.retailPrice ?? ""}
                onChange={(e) => setDraft({ ...draft, retailPrice: e.target.value })}
                disabled={draft.hasVariants}
              />
            </Field>

            <Field label="Precio mayorista">
              <input
                className={inputCls}
                value={draft.wholesalePrice ?? ""}
                onChange={(e) => setDraft({ ...draft, wholesalePrice: e.target.value || null })}
                disabled={draft.hasVariants}
              />
            </Field>

            <Field label="Cantidad mínima mayorista">
              <input
                type="number"
                className={inputCls}
                value={draft.wholesaleMinQuantity ?? 10}
                onChange={(e) =>
                  setDraft({ ...draft, wholesaleMinQuantity: Number(e.target.value || 0) })
                }
                disabled={draft.hasVariants}
              />
            </Field>

            <Field label="Precio mínimo venta">
              <input
                className={inputCls}
                value={draft.minSalePrice ?? ""}
                onChange={(e) => setDraft({ ...draft, minSalePrice: e.target.value || null })}
                disabled={draft.hasVariants}
              />
            </Field>

            <Field label="Precio máximo venta">
              <input
                className={inputCls}
                value={draft.maxSalePrice ?? ""}
                onChange={(e) => setDraft({ ...draft, maxSalePrice: e.target.value || null })}
                disabled={draft.hasVariants}
              />
            </Field>

            {/* STOCKS — deshabilitados si hay variantes */}
            <Field label="Stock mínimo">
              <input
                type="number"
                className={inputCls}
                value={draft.minStock ?? 0}
                onChange={(e) => setDraft({ ...draft, minStock: Number(e.target.value || 0) })}
                disabled={draft.hasVariants}
              />
            </Field>

            <Field label="Stock actual">
              <input
                type="number"
                className={inputCls}
                value={draft.currentStock ?? 0}
                onChange={(e) =>
                  setDraft({ ...draft, currentStock: Number(e.target.value || 0) })
                }
                disabled={draft.hasVariants}
              />
            </Field>

            <Field label="Stock reservado">
              <input
                type="number"
                className={inputCls}
                value={draft.reservedStock ?? 0}
                onChange={(e) =>
                  setDraft({ ...draft, reservedStock: Number(e.target.value || 0) })
                }
                disabled={draft.hasVariants}
              />
            </Field>

            {/* ✅ CHECKBOX hasVariants */}
            <Field label="Variantes">
              <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-muted)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-black relative z-10"
                  checked={Boolean(draft.hasVariants)}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      hasVariants: e.target.checked,
                    }))
                  }
                />
                <span>Este producto tiene variantes</span>
                <span className="ml-auto text-[10px] opacity-60">
                  {draft.hasVariants ? "✅ ON" : "⬜ OFF"}
                </span>
              </label>
              {draft.hasVariants && mode === "create" && (
                <p className="mt-1 text-[11px] text-amber-600">
                  💡 Las variantes se podrán gestionar después de crear el producto.
                </p>
              )}
            </Field>
          </div>

          {/* 🔥 SECCIÓN DE VARIANTES — Solo en edición y si hasVariants = true */}
          {mode === "edit" && productId && draft.hasVariants && (
            <div className="mt-6 rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-muted)]/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">✨ Variantes del producto</h3>
                  <p className="text-xs opacity-70">
                    Gestiona colores, tamaños, SKU y precios individuales.
                  </p>
                </div>
                {!showVariantForm && (
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-muted)]"
                  >
                    + Nueva variante
                  </button>
                )}
              </div>

              {/* Formulario de variante */}
              {showVariantForm && (
                <div className="mb-4 rounded-xl border border-[var(--color-border)] p-4 space-y-3 bg-[var(--color-surface)]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium opacity-80">Color</label>
                      <input
                        className={inputCls}
                        value={variantForm.color ?? ""}
                        onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                        placeholder="Ej: Rojo"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium opacity-80">Tamaño</label>
                      <input
                        className={inputCls}
                        value={variantForm.size ?? ""}
                        onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                        placeholder="Ej: M"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium opacity-80">Precio venta *</label>
                      <input
                        className={inputCls}
                        value={variantForm.retailPrice ?? ""}
                        onChange={(e) =>
                          setVariantForm({ ...variantForm, retailPrice: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium opacity-80">Stock actual</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={variantForm.currentStock ?? 0}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            currentStock: Number(e.target.value || 0),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium opacity-80">Stock reservado</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={variantForm.reservedStock ?? 0}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            reservedStock: Number(e.target.value || 0),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium opacity-80">Estado</label>
                      <select
                        className={inputCls}
                        value={variantForm.status ?? "ACTIVE"}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            status: e.target.value as "ACTIVE" | "INACTIVE",
                          })
                        }
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveVariant}
                      disabled={savingVariant}
                      className="rounded-xl border border-[var(--color-border)] bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {savingVariant ? "Guardando..." : editingVariantId ? "Actualizar" : "Crear"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelVariantForm}
                      disabled={savingVariant}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de variantes */}
              <div className="space-y-2">
                {loadingVariants ? (
                  <div className="p-4 text-center text-sm opacity-70">Cargando variantes...</div>
                ) : variants.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm opacity-70 text-center">
                    No hay variantes registradas. Haz clic en "Nueva variante" para comenzar.
                  </div>
                ) : (
                  variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          {v.color && (
                            <span className="px-2 py-0.5 rounded bg-gray-100">{v.color}</span>
                          )}
                          {v.size && (
                            <span className="px-2 py-0.5 rounded bg-gray-100 ml-1">{v.size}</span>
                          )}
                        </div>
                        <div className="text-xs opacity-70">
                          {v.sku && <span>SKU: {v.sku} • </span>}
                          {v.retailPrice && <span>${v.retailPrice}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            v.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {v.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditVariant(v)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(v.id)}
                          disabled={savingVariant}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {mode === "edit" && productId && (
            <div className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
              <div>
                <div className="text-sm font-semibold">Productos recomendados</div>
                <div className="text-xs opacity-70">
                  Agrega productos relacionados para sugerirlos en el detalle del producto.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <ProductCombobox
                  options={availableRecommendationOptions}
                  value={selectedRecommendedId}
                  onChange={setSelectedRecommendedId}
                  placeholder="Buscar producto..."
                />
                <input
                  type="number"
                  className={inputCls}
                  value={recommendationPriority}
                  onChange={(e) => setRecommendationPriority(Number(e.target.value || 0))}
                  placeholder="Prioridad"
                />
                <button
                  type="button"
                  onClick={handleAddRecommendation}
                  disabled={!selectedRecommendedId || savingRecommendation}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                {(recommendations ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] p-3 text-sm opacity-70">
                    Aún no hay productos recomendados.
                  </div>
                ) : (
                  recommendations!.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{r.recommendedProduct.name}</div>
                        <div className="text-xs opacity-70">
                          {r.recommendedProduct.code} • Prioridad: {r.priority}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecommendation(r.id)}
                        disabled={savingRecommendation}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="text-[11px] opacity-60">
                En modo creación, primero guarda el producto y luego podrás asignar recomendados.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-muted)]"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={uploading || savingVariant}
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