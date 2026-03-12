"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import SuppliersTable from "@/src/components/suppliers/SuppliersTable";
import SuppliersModal from "@/src/components/suppliers/SuppliersModal";
import type { Supplier, SupplierDraft } from "@/src/components/suppliers/types";
import { emptySupplierDraft } from "@/src/components/suppliers/types";

import {
  getSuppliersApi,
  createSupplierApi,
  updateSupplierApi,
  deactivateSupplierApi,
  type SupplierApiRecord,
} from "@/src/lib/api/suppliers";

function mapApiSupplierToSupplier(s: SupplierApiRecord | null | undefined): Supplier {
  return {
    id: String(s?.id ?? ""),
    name: String(s?.name ?? ""),
    contact: String(s?.contact ?? ""),
    email: String(s?.email ?? ""),
    phone: String(s?.phone ?? ""),
    address: String(s?.address ?? ""),
    active: Boolean(s?.active),
    createdAt: s?.createdAt,
    updatedAt: s?.updatedAt,
  };
}

export default function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Partial<SupplierDraft>>(emptySupplierDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadSuppliers() {
    setLoading(true);

    try {
      const result = await getSuppliersApi({
        page: 1,
        pageSize: 50,
      });

      const apiItems = result?.data?.items ?? [];
      setItems(apiItems.map(mapApiSupplierToSupplier).filter((x) => x.id));
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudieron cargar los proveedores",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function handleCreate() {
    setModalMode("create");
    setSelected(emptySupplierDraft);
    setSelectedId(null);
    setModalOpen(true);
  }

  function handleEdit(supplier: Supplier) {
    setModalMode("edit");
    setSelected({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      active: supplier.active,
    });
    setSelectedId(supplier.id);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    const supplier = items.find((x) => x.id === id);
    if (!supplier) return;

    const confirmed = window.confirm(
      `¿Deseas desactivar el proveedor ${supplier.name}?`
    );

    if (!confirmed) return;

    try {
      await deactivateSupplierApi(id);

      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, active: false } : x))
      );

      toast.success("Proveedor desactivado");
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo desactivar el proveedor",
      });
    }
  }

  async function handleSubmit(draft: SupplierDraft) {
    try {
      if (modalMode === "create") {
        const created = await createSupplierApi({
          name: draft.name,
          contact: draft.contact || null,
          email: draft.email || null,
          phone: draft.phone || null,
          address: draft.address || null,
          active: draft.active,
        });

        const createdSupplier = created?.data;

        if (!createdSupplier?.id) {
          throw new Error("La API no devolvió el proveedor creado");
        }

        setItems((prev) => [mapApiSupplierToSupplier(createdSupplier), ...prev]);
        toast.success("Proveedor creado");
      } else {
        if (!selectedId) {
          toast.error("Error", {
            description: "No se encontró el proveedor a editar.",
          });
          return;
        }

        const updated = await updateSupplierApi(selectedId, {
          name: draft.name,
          contact: draft.contact || null,
          email: draft.email || null,
          phone: draft.phone || null,
          address: draft.address || null,
          active: draft.active,
        });

        const updatedSupplier = updated?.data;

        if (!updatedSupplier?.id) {
          throw new Error("La API no devolvió el proveedor actualizado");
        }

        setItems((prev) =>
          prev.map((x) =>
            x.id === selectedId ? mapApiSupplierToSupplier(updatedSupplier) : x
          )
        );

        toast.success("Proveedor actualizado");
      }

      setModalOpen(false);
      setSelected(emptySupplierDraft);
      setSelectedId(null);
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo guardar el proveedor",
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-600">
            Gestiona los proveedores y contactos comerciales del sistema.
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
          <SuppliersTable
            data={items}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal */}
      <SuppliersModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => {
          setModalOpen(false);
          setSelected(emptySupplierDraft);
          setSelectedId(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}