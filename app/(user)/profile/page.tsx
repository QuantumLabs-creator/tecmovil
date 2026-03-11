"use client";

import { useEffect, useState } from "react";
import { meApi } from "@/src/lib/api/auth";

type MeUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    async function load() {
      const result = await meApi().catch(() => null);
      const me = result?.data?.user ?? null;
      setUser(me);
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Revisa la información de tu cuenta.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-zinc-400">Nombre</div>
            <div className="mt-1 text-sm font-medium">{user?.name ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Correo</div>
            <div className="mt-1 text-sm font-medium">{user?.email ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs text-zinc-400">Rol</div>
            <div className="mt-1 text-sm font-medium">{user?.role ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}