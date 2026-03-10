"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);

        const role = json?.data?.user?.role ?? json?.user?.role;
        if (!mounted) return;

        setRoles(role ? [String(role).toUpperCase()] : []);
      } catch {
        if (!mounted) return;
        setRoles([]);
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="flex min-h-dvh w-full">
        <div className="hidden md:block">
          <Sidebar
            roles={roles}
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
          />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-50 h-full w-[280px] bg-[var(--color-bg)]">
              <Sidebar
                roles={roles}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
            <Topbar onOpenMenu={() => setMobileOpen(true)} />
          </div>
          <main className="flex-1 p-4 sm:p-6">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}