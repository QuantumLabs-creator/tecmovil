"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import CategoriesTable from "@/src/components/categories/CategoriesTable";
import CategoriesModal from "@/src/components/categories/CategoriesModal";
import type { Category, CategoryDraft } from "@/src/components/categories/types";
import { emptyCategoryDraft } from "@/src/components/categories/types";

import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deactivateCategoryApi,
  type CategoryApiRecord,
} from "@/src/lib/api/categories";

function mapApiCategoryToCategory(c: CategoryApiRecord | null | undefined): Category {
  return {
    id: String(c?.id ?? ""),
    name: String(c?.name ?? ""),
    description: String(c?.description ?? ""),
    active: Boolean(c?.active),
    createdAt: c?.createdAt,
    updatedAt: c?.updatedAt,
  };
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Partial<CategoryDraft>>(emptyCategoryDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);

    try {
      const result = await getCategoriesApi({
        page: 1,
        pageSize: 50,
      });

      const apiItems = result?.data?.items ?? [];
      setItems(apiItems.map(mapApiCategoryToCategory).filter((x) => x.id));
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudieron cargar las categorías",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleCreate() {
    setModalMode("create");
    setSelected(emptyCategoryDraft);
    setSelectedId(null);
    setModalOpen(true);
  }

  function handleEdit(category: Category) {
    setModalMode("edit");
    setSelected({
      name: category.name,
      description: category.description,
      active: category.active,
    });
    setSelectedId(category.id);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    const category = items.find((x) => x.id === id);
    if (!category) return;

    const confirmed = window.confirm(
      `¿Deseas desactivar la categoría ${category.name}?`
    );

    if (!confirmed) return;

    try {
      await deactivateCategoryApi(id);

      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, active: false } : x))
      );

      toast.success("Categoría desactivada");
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo desactivar la categoría",
      });
    }
  }

  async function handleSubmit(draft: CategoryDraft) {
    try {
      if (modalMode === "create") {
        const created = await createCategoryApi({
          name: draft.name,
          description: draft.description || null,
          active: draft.active,
        });

        const createdCategory = created?.data;

        if (!createdCategory?.id) {
          throw new Error("La API no devolvió la categoría creada");
        }

        setItems((prev) => [mapApiCategoryToCategory(createdCategory), ...prev]);
        toast.success("Categoría creada");
      } else {
        if (!selectedId) {
          toast.error("Error", {
            description: "No se encontró la categoría a editar.",
          });
          return;
        }

        const updated = await updateCategoryApi(selectedId, {
          name: draft.name,
          description: draft.description || null,
          active: draft.active,
        });

        const updatedCategory = updated?.data;

        if (!updatedCategory?.id) {
          throw new Error("La API no devolvió la categoría actualizada");
        }

        setItems((prev) =>
          prev.map((x) =>
            x.id === selectedId ? mapApiCategoryToCategory(updatedCategory) : x
          )
        );

        toast.success("Categoría actualizada");
      }

      setModalOpen(false);
      setSelected(emptyCategoryDraft);
      setSelectedId(null);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo guardar la categoría",
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-600">
            Organiza y gestiona las categorías del catálogo de productos.
          </p>
        </div>

       
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{items.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Activas</div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">
            {items.filter((x) => x.active).length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">Inactivas</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">
            {items.filter((x) => !x.active).length}
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
          <CategoriesTable
            data={items}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal */}
      <CategoriesModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => {
          setModalOpen(false);
          setSelected(emptyCategoryDraft);
          setSelectedId(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}