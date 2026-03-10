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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Categorías</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Gestiona las categorías del catálogo de productos.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        {loading ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-zinc-300">
            Cargando categorías...
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