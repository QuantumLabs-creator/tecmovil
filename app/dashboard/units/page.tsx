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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Unidades</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Gestiona las unidades de medida del catálogo.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        {loading ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-zinc-300">
            Cargando unidades...
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