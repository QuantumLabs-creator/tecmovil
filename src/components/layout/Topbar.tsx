"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../theme/ThemeProvider";

// ✅ Iconos
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

type MeUser = {
  id: string;
  name?: string | null;
  email: string;
  // ajusta según tu modelo real: role, roles[], etc.
  role?: string; // "ADMIN" | "USER" | "SELLER" ...
};

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [openUserMenu, setOpenUserMenu] = useState(false);

  // ✅ Cargar sesión (cookie)
  useEffect(() => {
    let alive = true;

    async function loadMe() {
      setLoadingMe(true);
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (!alive) return;
        if (!res.ok) {
          setMe(null);
          return;
        }
        const json = await res.json().catch(() => null);
        setMe(json?.user ?? json ?? null); // soporta {user} o directo
      } finally {
        if (alive) setLoadingMe(false);
      }
    }

    loadMe();
    return () => {
      alive = false;
    };
  }, []);

  const isLogged = !!me;

  // ✅ Define “usuario normal” (ajusta según tu esquema real)
  const isNormalUser = useMemo(() => {
    const r = (me?.role ?? "").toUpperCase();
    // normal: USER o SELLER (si SELLER también debe ver pedidos/perfil, déjalo)
    return r === "USER" || r === "SELLER" || r === "";
  }, [me?.role]);

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setMe(null);
      setOpenUserMenu(false);
      router.replace("/auth"); // o "/" si prefieres
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur transition-colors duration-300">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* ✅ Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] md:hidden transition-opacity"
            onClick={onOpenMenu}
            aria-label="Abrir menú de navegación"
            aria-controls="mobile-menu"
          >
            <MenuIcon />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight truncate">Gestión - Inventario</h1>
            <p className="text-[11px] opacity-70 leading-tight">
              {isLogged ? "Sesión activa" : loadingMe ? "Verificando sesión..." : "Invitado"}
            </p>
          </div>
        </div>

        {/* ✅ Right */}
        <div className="flex items-center gap-2">
          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-1.5 text-xs hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-200"
            aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
            title={`Tema actual: ${isDark ? "Oscuro" : "Claro"}`}
          >
            <span className="relative flex items-center justify-center w-4 h-4">
              <span
                className={`absolute transition-all duration-200 ${
                  isDark ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
              >
                <SunIcon />
              </span>
              <span
                className={`absolute transition-all duration-200 ${
                  isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
              >
                <MoonIcon />
              </span>
            </span>
            <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
          </button>

          <time className="hidden sm:block text-xs opacity-70" dateTime="2026">
            2026
          </time>

          {/* ✅ Links extra SOLO si es usuario normal */}
          {isLogged && isNormalUser && (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/my-orders"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-1.5 text-xs hover:opacity-80 transition"
              >
                Mis pedidos
              </Link>
              <Link
                href="/profile"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-1.5 text-xs hover:opacity-80 transition"
              >
                Perfil
              </Link>
            </div>
          )}

          {/* ✅ User Menu */}
          <div className="relative">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-muted)] ring-1 ring-[var(--color-border)] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-opacity"
              aria-label="Abrir menú de usuario"
              onClick={() => setOpenUserMenu((v) => !v)}
            >
              <UserIcon />
            </button>

            {openUserMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg overflow-hidden"
                role="menu"
              >
                <div className="px-4 py-3 text-xs">
                  <div className="font-semibold truncate">{me?.name ?? "Usuario"}</div>
                  <div className="opacity-70 truncate">{me?.email ?? ""}</div>
                </div>

                <div className="h-px bg-[var(--color-border)]" />

                {/* En móvil, también mostramos pedidos/perfil aquí */}
                {isLogged && isNormalUser && (
                  <div className="md:hidden">
                    <Link
                      href="/my-orders"
                      className="block px-4 py-2.5 text-sm hover:bg-[var(--color-bg-muted)]"
                      onClick={() => setOpenUserMenu(false)}
                    >
                      Mis pedidos
                    </Link>
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm hover:bg-[var(--color-bg-muted)]"
                      onClick={() => setOpenUserMenu(false)}
                    >
                      Perfil
                    </Link>
                    <div className="h-px bg-[var(--color-border)]" />
                  </div>
                )}

                {!isLogged ? (
                  <Link
                    href="/auth"
                    className="block px-4 py-2.5 text-sm hover:bg-[var(--color-bg-muted)]"
                    onClick={() => setOpenUserMenu(false)}
                  >
                    Iniciar sesión
                  </Link>
                ) : (
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-bg-muted)]"
                  >
                    Cerrar sesión
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}