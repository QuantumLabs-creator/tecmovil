"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import UsersTable from "@/src/components/users/UsersTable";
import UsersModal from "@/src/components/users/UsersModal";
import type { User, UserDraft } from "@/src/components/users/types";
import { emptyUserDraft } from "@/src/components/users/types";

import {
  getUsersApi,
  updateUserApi,
  type UserApiRecord,
} from "@/src/lib/api/users";

function mapApiUserToUser(u: UserApiRecord): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    phone: u.phone ?? "",
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastLogin: u.lastLogin ?? null,
  };
}

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("edit");
  const [selected, setSelected] = useState<Partial<UserDraft>>(emptyUserDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);

    try {
      const result = await getUsersApi({
        page: 1,
        pageSize: 50,
      });

      setItems((result.data?.items ?? []).map(mapApiUserToUser));
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudieron cargar los usuarios",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleCreate() {
    setModalMode("create");
    setSelected(emptyUserDraft);
    setSelectedId(null);
    setModalOpen(true);
  }

  function handleEdit(user: User) {
    setModalMode("edit");
    setSelected({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      password: "",
    });
    setSelectedId(user.id);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    const user = items.find((x) => x.id === id);
    if (!user) return;

    const confirmed = window.confirm(
      `¿Deseas ${user.active ? "desactivar" : "activar"} a ${user.name}?`
    );

    if (!confirmed) return;

    try {
      const updated = await updateUserApi(id, {
        active: !user.active,
      });

      const updatedUser = updated.data;

      setItems((prev) =>
        prev.map((x) => (x.id === id ? mapApiUserToUser(updatedUser) : x))
      );

      toast.success(
        updatedUser.active ? "Usuario activado" : "Usuario desactivado"
      );
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo actualizar el usuario",
      });
    }
  }

  async function handleSubmit(draft: UserDraft) {
    if (modalMode === "create") {
      toast.info("Pendiente", {
        description: "La creación de usuarios aún no está implementada en el backend.",
      });
      return;
    }

    if (!selectedId) {
      toast.error("Error", {
        description: "No se encontró el usuario a editar.",
      });
      return;
    }

    try {
      const updated = await updateUserApi(selectedId, {
        name: draft.name,
        phone: draft.phone || null,
        role: draft.role,
        active: draft.active,
      });

      const updatedUser = updated.data;

      setItems((prev) =>
        prev.map((x) => (x.id === selectedId ? mapApiUserToUser(updatedUser) : x))
      );

      setModalOpen(false);
      setSelected(emptyUserDraft);
      setSelectedId(null);

      toast.success("Usuario actualizado");
    } catch (e: any) {
      toast.error("Error", {
        description: e?.error || e?.message || "No se pudo actualizar el usuario",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Gestiona roles, estado y datos básicos de los usuarios del sistema.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
        {loading ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm text-zinc-300">
            Cargando usuarios...
          </div>
        ) : (
          <UsersTable
            data={items}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <UsersModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => {
          setModalOpen(false);
          setSelected(emptyUserDraft);
          setSelectedId(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}