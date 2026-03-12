"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import UnitsTable from "@/src/components/units/UnitsTable";
import UnitsModal from "@/src/components/units/UnitsModal";
import type { Unit, UnitDraft } from "@/src/components/units/types";
import { emptyUnitDraft } from "@/src/components/units/types";

import {
  getUnitsApi,
  createUnitApi,
  updateUnitApi,
  deactivateUnitApi,
  type UnitApiRecord,
} from "@/src/lib/api/units";

function mapApiUnitToUnit(u: UnitApiRecord | null | undefined): Unit {
  return {
    id: String(u?.id ?? ""),
    name: String(u?.name ?? ""),
    symbol: String(u?.symbol ?? ""),
    active: Boolean(u?.active),
    createdAt: u?.createdAt,
    updatedAt: u?.updatedAt,
  };
}

export default function UnitsPage() {
  const [items, setItems] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Partial<UnitDraft>>(emptyUnitDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadUnits() {
    setLoading(true);

    try {
      const result = await getUnitsApi({
        page: 1,
        pageSize: 50,
      });

      const apiItems = result?.data?.items ?? [];
      setItems(apiItems.map(mapApiUnitToUnit).filter((x) => x.id));
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudieron cargar las unidades",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnits();
  }, []);

  function handleCreate() {
    setModalMode("create");
    setSelected(emptyUnitDraft);
    setSelectedId(null);
    setModalOpen(true);
  }

  function handleEdit(unit: Unit) {
    setModalMode("edit");
    setSelected({
      name: unit.name,
      symbol: unit.symbol,
      active: unit.active,
    });
    setSelectedId(unit.id);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    const unit = items.find((x) => x.id === id);
    if (!unit) return;

    const confirmed = window.confirm(
      `¿Deseas desactivar la unidad ${unit.name}?`
    );

    if (!confirmed) return;

    try {
      await deactivateUnitApi(id);

      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, active: false } : x))
      );

      toast.success("Unidad desactivada");
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo desactivar la unidad",
      });
    }
  }

  async function handleSubmit(draft: UnitDraft) {
    try {
      if (modalMode === "create") {
        const created = await createUnitApi({
          name: draft.name,
          symbol: draft.symbol || null,
          active: draft.active,
        });

        const createdUnit = created?.data;

        if (!createdUnit?.id) {
          throw new Error("La API no devolvió la unidad creada");
        }

        setItems((prev) => [mapApiUnitToUnit(createdUnit), ...prev]);
        toast.success("Unidad creada");
      } else {
        if (!selectedId) {
          toast.error("Error", {
            description: "No se encontró la unidad a editar.",
          });
          return;
        }

        const updated = await updateUnitApi(selectedId, {
          name: draft.name,
          symbol: draft.symbol || null,
          active: draft.active,
        });

        const updatedUnit = updated?.data;

        if (!updatedUnit?.id) {
          throw new Error("La API no devolvió la unidad actualizada");
        }

        setItems((prev) =>
          prev.map((x) =>
            x.id === selectedId ? mapApiUnitToUnit(updatedUnit) : x
          )
        );

        toast.success("Unidad actualizada");
      }

      setModalOpen(false);
      setSelected(emptyUnitDraft);
      setSelectedId(null);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo guardar la unidad",
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Unidades de Medida</h1>
          <p className="text-sm text-gray-600">
            Gestiona las unidades de medida del catálogo de productos.
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
          <UnitsTable
            data={items}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal */}
      <UnitsModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => {
          setModalOpen(false);
          setSelected(emptyUnitDraft);
          setSelectedId(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}