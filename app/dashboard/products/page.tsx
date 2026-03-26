"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import ProductsTable from "@/src/components/products/ProductsTable";
import ProductsModal from "@/src/components/products/ProductsModal";

import type {
  Product,
  ProductDraft,
  ProductOption,
} from "@/src/components/products/types";
import { emptyProductDraft } from "@/src/components/products/types";

import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  deactivateProductApi,
  type Product as ProductApiRecord,
} from "@/src/lib/api/products";

import {
  getProductRecommendationsApi,
  createProductRecommendationApi,
  deleteProductRecommendationApi,
  type ProductRecommendation,
} from "@/src/lib/api/recommendations";

import { getCategoriesApi } from "@/src/lib/api/categories";
import { getSuppliersApi } from "@/src/lib/api/suppliers";
import { getUnitsApi } from "@/src/lib/api/units";

// --- Tipos auxiliares ---

type AdminCredentials = {
  email: string;
  password: string;
};

// --- Mapeo de API a frontend ---

function mapApiProductToProduct(p: ProductApiRecord | null | undefined): Product {
  return {
    id: String(p?.id ?? ""),
    code: String(p?.code ?? ""),
    name: String(p?.name ?? ""),
    description: p?.description ?? null,
    image: p?.image ?? null,

    purchasePrice: String(p?.purchasePrice ?? ""),
    retailPrice: String(p?.retailPrice ?? ""),
    wholesalePrice: p?.wholesalePrice ?? null,
    wholesaleMinQuantity: Number(p?.wholesaleMinQuantity ?? 10),

    minSalePrice: p?.minSalePrice ?? null,
    maxSalePrice: p?.maxSalePrice ?? null,

    minStock: Number(p?.minStock ?? 0),
    currentStock: Number(p?.currentStock ?? 0),
    reservedStock: Number(p?.reservedStock ?? 0),

    hasVariants: Boolean((p as any)?.hasVariants ?? false),

    pendingRequestedStock: Number(p?.pendingRequestedStock ?? 0),
    availableRealStock: Number(p?.availableRealStock ?? 0),
    availableCommercialStock: Number(p?.availableCommercialStock ?? 0),

    status: String(p?.status ?? "ACTIVE") as Product["status"],

    createdAt: p?.createdAt,
    updatedAt: p?.updatedAt,

    categoryId: String(p?.categoryId ?? ""),
    supplierId: p?.supplierId ?? null,
    unitId: String(p?.unitId ?? ""),

    category: p?.category
      ? { id: String(p.category.id), name: String(p.category.name) }
      : undefined,

    supplier: p?.supplier
      ? { id: String(p.supplier.id), name: String(p.supplier.name) }
      : null,

    unit: p?.unit
      ? {
        id: String(p.unit.id),
        name: String(p.unit.name),
        symbol: p.unit.symbol ?? null,
      }
      : undefined,
  };
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para el filtro de stock (tabla principal)
  const [stockFilter, setStockFilter] = useState<"all" | "low">("all");

  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<ProductOption[]>([]);
  const [units, setUnits] = useState<ProductOption[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Partial<ProductDraft>>(emptyProductDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);

  // ✅ NUEVOS ESTADOS PARA MODAL DE ADMINISTRADOR
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>({
    email: "",
    password: "",
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);

    try {
      const result = await getProductsApi({
        page: 1,
        pageSize: 100,
      });

      const apiItems = result?.data?.items ?? [];
      setItems(apiItems.map(mapApiProductToProduct).filter((x) => x.id));
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudieron cargar los productos",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [categoriesRes, suppliersRes, unitsRes] = await Promise.all([
        getCategoriesApi({ page: 1, pageSize: 100 }),
        getSuppliersApi({ page: 1, pageSize: 100 }),
        getUnitsApi({ page: 1, pageSize: 100 }),
      ]);

      setCategories(
        (categoriesRes?.data?.items ?? []).map((x: any) => ({
          id: String(x.id),
          name: String(x.name),
        }))
      );

      setSuppliers(
        (suppliersRes?.data?.items ?? []).map((x: any) => ({
          id: String(x.id),
          name: String(x.name),
        }))
      );

      setUnits(
        (unitsRes?.data?.items ?? []).map((x: any) => ({
          id: String(x.id),
          name: String(x.name),
          symbol: x.symbol ?? null,
        }))
      );
    } catch (e: any) {
      toast.error("Error", {
        description:
          e?.error || e?.message || "No se pudieron cargar categorías, proveedores o unidades",
      });
    }
  }

  useEffect(() => {
    loadProducts();
    loadOptions();
  }, []);

  function handleCreate() {
    setModalMode("create");
    setSelected(emptyProductDraft);
    setSelectedId(null);
    setModalOpen(true);
    setRecommendations([]);
  }

  function handleEdit(product: Product) {
    setModalMode("edit");
    setSelected({
      code: product.code,
      name: product.name,
      description: product.description,
      image: product.image,

      purchasePrice: product.purchasePrice,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      wholesaleMinQuantity: product.wholesaleMinQuantity,

      minSalePrice: product.minSalePrice,
      maxSalePrice: product.maxSalePrice,

      minStock: product.minStock,
      currentStock: product.currentStock,
      reservedStock: product.reservedStock,

      hasVariants: product.hasVariants,

      pendingRequestedStock: product.pendingRequestedStock,
      availableRealStock: product.availableRealStock,
      availableCommercialStock: product.availableCommercialStock,

      status: product.status,

      categoryId: product.categoryId,
      supplierId: product.supplierId,
      unitId: product.unitId,
    });
    setSelectedId(product.id);
    setModalOpen(true);

    getProductRecommendationsApi(product.id)
      .then((res) => {
        const data = res?.data;
        setRecommendations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn("Error cargando recomendaciones:", err);
        setRecommendations([]);
      });
  }

  // ✅ FUNCIÓN ACTUALIZADA: Abre modal de admin en lugar de confirmar directamente
  function handleDelete(id: string) {
    const product = items.find((x) => x.id === id);
    if (!product) return;

    // Guardamos el ID pendiente y abrimos el modal de admin
    setPendingDeleteId(id);
    setAdminCredentials({ email: "", password: "" });
    setAdminModalOpen(true);
  }

  // ✅ NUEVA FUNCIÓN: Verifica credenciales de admin y ejecuta la eliminación
  async function handleAdminConfirm() {
    if (!pendingDeleteId) return;

    const { email, password } = adminCredentials;

    // Validaciones básicas del frontend
    if (!email.trim()) {
      toast.error("Ingresa tu correo de administrador");
      return;
    }

    if (!password.trim()) {
      toast.error("Ingresa tu contraseña");
      return;
    }

    try {
      setAdminLoading(true);

      // ✅ VERIFICACIÓN DE CREDENCIALES
      // Reemplaza esta llamada con tu endpoint real de autenticación
      const authResponse = await fetch("/api/auth/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Credenciales inválidas");
      }

      // Si la autenticación es exitosa, procedemos con la desactivación
      const product = items.find((x) => x.id === pendingDeleteId);
      
      await deactivateProductApi(pendingDeleteId);

      setItems((prev) =>
        prev.map((x) =>
          x.id === pendingDeleteId ? { ...x, status: "ARCHIVED" } : x
        )
      );

      toast.success("Producto archivado", {
        description: product?.name ? `"${product.name}" ha sido desactivado` : undefined,
      });

      // Resetear estados
      setPendingDeleteId(null);
      setAdminModalOpen(false);
      setAdminCredentials({ email: "", password: "" });
    } catch (e: any) {
      toast.error("Error de autenticación", {
        description: e?.message || "No se pudo verificar tu identidad como administrador",
      });
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleSubmit(draft: ProductDraft) {
    try {
      const payload = {
        code: draft.code || undefined,
        name: draft.name,
        description: draft.description || null,
        image: draft.image || null,

        purchasePrice: draft.purchasePrice,
        retailPrice: draft.retailPrice,
        wholesalePrice: draft.wholesalePrice || null,
        wholesaleMinQuantity: draft.wholesaleMinQuantity,

        minSalePrice: draft.minSalePrice || null,
        maxSalePrice: draft.maxSalePrice || null,

        minStock: draft.minStock,
        currentStock: draft.currentStock,
        reservedStock: draft.reservedStock,

        hasVariants: Boolean(draft.hasVariants),

        status: draft.status,

        categoryId: draft.categoryId,
        supplierId: draft.supplierId || null,
        unitId: draft.unitId,
      };

      if (modalMode === "create") {
        const created = await createProductApi(payload);
        const createdProduct = created?.data?.product;

        if (!createdProduct?.id) {
          throw new Error("La API no devolvió el producto creado");
        }

        setItems((prev) => [mapApiProductToProduct(createdProduct), ...prev]);
        toast.success("Producto creado");
      } else {
        if (!selectedId) {
          toast.error("Error", {
            description: "No se encontró el producto a editar.",
          });
          return;
        }

        const updated = await updateProductApi(selectedId, payload);
        const updatedProduct = updated?.data?.product;

        if (!updatedProduct?.id) {
          throw new Error("La API no devolvió el producto actualizado");
        }

        setItems((prev) =>
          prev.map((x) =>
            x.id === selectedId ? mapApiProductToProduct(updatedProduct) : x
          )
        );

        toast.success("Producto actualizado");
      }

      setModalOpen(false);
      setSelected(emptyProductDraft);
      setSelectedId(null);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo guardar el producto",
      });
    }
  }

  // Lógica para filtrar los items de la tabla principal por stock
  const displayedItems = items.filter((item) => {
    if (stockFilter === "low") {
      return Number(item.availableCommercialStock ?? 0) <= Number(item.minStock ?? 0);
    }
    return true;
  });

  // ✅ Opciones simples para el combobox del modal (sin filtrar aquí)
  const productOptions: ProductOption[] = items.map((x) => ({
    id: x.id,
    name: `${x.name}${x.code ? ` (${x.code})` : ""}`,
  }));

  async function handleAddRecommendation(recommendedProductId: string, priority?: number) {
    if (!selectedId) return;

    const alreadyExists = recommendations.some(
      (r) => String(r.recommendedProductId) === String(recommendedProductId)
    );

    if (alreadyExists) {
      toast.error("Ese producto ya está agregado como recomendado");
      return;
    }

    try {
      const created = await createProductRecommendationApi({
        productId: selectedId,
        recommendedProductId,
        priority: priority ?? 0,
      });

      setRecommendations((prev) => [...prev, created.data]);
      toast.success("Recomendación agregada");
    } catch (e: any) {
      toast.error("Error", {
        description:
          e?.error || e?.message || "No se pudo agregar la recomendación",
      });
    }
  }

  async function handleRemoveRecommendation(recommendationId: string) {
    await deleteProductRecommendationApi(recommendationId);

    setRecommendations((prev) => prev.filter((x) => x.id !== recommendationId));
    toast.success("Recomendación eliminada");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Productos</h1>
          <p className="text-sm text-gray-600">
            Gestiona el inventario de productos del sistema.
          </p>
        </div>

        {/* Filtro de stock para la tabla principal */}
        <div className="flex items-center gap-2">
          <label htmlFor="stock-filter" className="text-sm font-medium text-gray-700">
            Filtrar:
          </label>
          <select
            id="stock-filter"
            value={stockFilter}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all" || value === "low") {
                setStockFilter(value as "all" | "low");
              }
            }}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
          >
            <option value="all">Todos los productos</option>
            <option value="low">Solo Stock Bajo</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{items.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">Activos</div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">
            {items.filter((x) => x.status === "ACTIVE").length}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-700">Inactivos</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">
            {items.filter((x) => x.status === "INACTIVE").length}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-amber-700">Stock Bajo</div>
          <div className="mt-1 text-2xl font-bold text-amber-800">
            {
              items.filter(
                (x) =>
                  x.status === "ACTIVE" &&
                  Number(x.availableCommercialStock ?? 0) <= Number(x.minStock ?? 0)
              ).length
            }
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-12 w-12 rounded-lg bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-48 bg-gray-100 rounded"></div>
                </div>
                <div className="h-8 w-24 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <ProductsTable
            data={displayedItems}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal de Producto */}
      <ProductsModal
        open={modalOpen}
        mode={modalMode}
        productId={selectedId}
        initial={selected}
        categories={categories}
        suppliers={suppliers}
        units={units}
        productOptions={productOptions}
        recommendations={(recommendations ?? []).map((r) => ({
          id: r.id,
          recommendedProductId: r.recommendedProductId,
          priority: r.priority,
          recommendedProduct: {
            id: r.recommendedProduct.id,
            code: r.recommendedProduct.code,
            name: r.recommendedProduct.name,
          },
        }))}
        onAddRecommendation={handleAddRecommendation}
        onRemoveRecommendation={handleRemoveRecommendation}
        onClose={() => {
          setModalOpen(false);
          setSelected(emptyProductDraft);
          setSelectedId(null);
          setRecommendations([]);
        }}
        onSubmit={handleSubmit}
      />

      {/* ✅ MODAL DE VERIFICACIÓN DE ADMINISTRADOR */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay con blur */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Cerrar modal"
            onClick={() => {
              if (adminLoading) return;
              setAdminModalOpen(false);
              setPendingDeleteId(null);
            }}
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header del modal */}
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200">
                <svg className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Verificación de administrador
                </h3>
                <p className="mt-0.5 text-sm text-gray-600">
                  Para archivar un producto, confirma tu identidad con credenciales de administrador.
                </p>
              </div>
            </div>

            {/* Formulario de credenciales */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdminConfirm();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={adminCredentials.email}
                  onChange={(e) =>
                    setAdminCredentials((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="admin@empresa.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                  disabled={adminLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) =>
                    setAdminCredentials((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
                  disabled={adminLoading}
                  autoComplete="current-password"
                />
              </div>

              {/* Nota de seguridad */}
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 flex items-start gap-2">
                <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>
                  Esta acción es irreversible. El producto quedará archivado y no estará disponible para la venta.
                </span>
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminModalOpen(false);
                    setPendingDeleteId(null);
                  }}
                  disabled={adminLoading}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adminLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Confirmar y archivar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}