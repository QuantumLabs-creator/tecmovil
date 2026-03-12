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

import { getCategoriesApi } from "@/src/lib/api/categories";
import { getSuppliersApi } from "@/src/lib/api/suppliers";
import { getUnitsApi } from "@/src/lib/api/units";

function mapApiProductToProduct(p: ProductApiRecord | null | undefined): Product {
  return {
    id: String(p?.id ?? ""),
    code: String(p?.code ?? ""),
    name: String(p?.name ?? ""),
    description: String(p?.description ?? ""),
    image: String(p?.image ?? ""),

    purchasePrice: String(p?.purchasePrice ?? ""),
    retailPrice: String(p?.retailPrice ?? ""),
    wholesalePrice: String(p?.wholesalePrice ?? ""),
    wholesaleMinQuantity: Number(p?.wholesaleMinQuantity ?? 10),

    minSalePrice: String(p?.minSalePrice ?? ""),
    maxSalePrice: String(p?.maxSalePrice ?? ""),

    minStock: Number(p?.minStock ?? 0),
    currentStock: Number(p?.currentStock ?? 0),
    reservedStock: Number(p?.reservedStock ?? 0),

    active: Boolean(p?.active),
    createdAt: p?.createdAt,
    updatedAt: p?.updatedAt,

    categoryId: String(p?.categoryId ?? ""),
    supplierId: String(p?.supplierId ?? ""),
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

  const [categories, setCategories] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<ProductOption[]>([]);
  const [units, setUnits] = useState<ProductOption[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Partial<ProductDraft>>(emptyProductDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

      active: product.active,

      categoryId: product.categoryId,
      supplierId: product.supplierId,
      unitId: product.unitId,
    });
    setSelectedId(product.id);
    setModalOpen(true);
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
        prev.map((x) => (x.id === id ? { ...x, active: false } : x))
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

        active: draft.active,

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

       
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{items.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Activos</div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">
            {items.filter((x) => x.active).length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">Inactivos</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">
            {items.filter((x) => !x.active).length}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wide">Stock Bajo</div>
          <div className="mt-1 text-2xl font-bold text-amber-800">
            {items.filter((x) => x.currentStock <= x.minStock).length}
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
            data={items}
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
        initial={selected}
        categories={categories}
        suppliers={suppliers}
        units={units}
        onClose={() => {
          setModalOpen(false);
          setSelected(emptyProductDraft);
          setSelectedId(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}