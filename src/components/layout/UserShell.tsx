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
        "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
        active
          ? "text-gray-900 bg-gray-100"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      )}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gray-900" />
      )}
    </Link>
  );
}

function UserAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-gray-200">
          <span className="text-xs font-semibold text-gray-700">{initials}</span>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        </span>
      </div>
      <div className="hidden sm:block min-w-0">
        <div className="truncate text-sm font-medium text-gray-900">{name}</div>
        <div className="truncate text-xs text-gray-500">{email}</div>
      </div>
    </div>
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
    return () => { mounted = false; };
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
      <div className="min-h-dvh bg-gray-50">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-16 rounded bg-gray-200 animate-pulse" />
              <nav className="hidden md:flex items-center gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
                  <div className="h-2 w-32 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
              <div className="h-9 w-28 rounded-xl bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="border-t border-gray-200 md:hidden">
            <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
        </header>
        {/* Content Skeleton */}
        <main className="mx-auto max-w-7xl p-6">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="h-40 rounded-2xl border border-gray-200 bg-white animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur shadow-sm shadow-gray-200/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-3">
            <Link 
              href="/shop" 
              className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white text-sm">
                S
              </span>
              <span className="hidden sm:inline">Shop</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/shop" label="Shop" pathname={pathname} />
              <NavLink href="/my-orders" label="Mis pedidos" pathname={pathname} />
              <NavLink href="/profile" label="Perfil" pathname={pathname} />
            </nav>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            {user && <UserAvatar name={user.name} email={user.email} />}
            
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="border-t border-gray-100 md:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            <NavLink href="/shop" label="Shop" pathname={pathname} />
            <NavLink href="/my-orders" label="Mis pedidos" pathname={pathname} />
            <NavLink href="/profile" label="Perfil" pathname={pathname} />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}