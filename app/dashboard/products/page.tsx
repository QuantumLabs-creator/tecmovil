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

  async function handleDelete(id: string) {
    const product = items.find((x) => x.id === id);
    if (!product) return;

    const confirmed = window.confirm(
      `¿Deseas desactivar el producto ${product.name}?`
    );

    if (!confirmed) return;

    try {
      await deactivateProductApi(id);

      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "ARCHIVED" } : x))
      );

      toast.success("Producto desactivado");
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo desactivar el producto",
      });
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

      {/* Modal */}
      <ProductsModal
        open={modalOpen}
        mode={modalMode}
        productId={selectedId}
        initial={selected}
        categories={categories}
        suppliers={suppliers}
        units={units}
        // ✅ Pasamos todas las opciones, el modal filtra internamente
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
    </div>
  );
}