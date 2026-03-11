"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutApi, meApi } from "@/src/lib/api/auth";

type MeUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active =
    pathname === href || (href !== "/shop" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl px-4 py-2 text-sm transition-colors whitespace-nowrap",
        active
          ? "bg-white text-black font-medium"
          : "text-zinc-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {label}
    </Link>
  );
}

export default function UserShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const result = await meApi();
        const me = result?.data?.user ?? null;

        if (!mounted) return;

        setUser(me);

        if (!me) {
          router.replace("/auth");
          return;
        }

        if (me.role !== "USER") {
          router.replace("/dashboard");
          return;
        }
      } catch {
        if (!mounted) return;
        router.replace("/auth");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMe();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      router.replace("/auth");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="mx-auto max-w-7xl p-6 text-sm text-zinc-400">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-sm font-semibold">
              Shop
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <NavLink href="/shop" label="Shop" pathname={pathname} />
              <NavLink href="/my-orders" label="Mis pedidos" pathname={pathname} />
              <NavLink href="/profile" label="Perfil" pathname={pathname} />
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium">{user?.name ?? "Usuario"}</div>
              <div className="text-xs text-zinc-400">{user?.email ?? ""}</div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-2 text-sm hover:opacity-90"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] md:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
            <NavLink href="/shop" label="Shop" pathname={pathname} />
            <NavLink href="/my-orders" label="Mis pedidos" pathname={pathname} />
            <NavLink href="/profile" label="Perfil" pathname={pathname} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}