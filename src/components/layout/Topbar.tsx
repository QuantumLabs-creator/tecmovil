"use client";

import { useTheme } from "../theme/ThemeProvider";

// ✅ Extraer iconos para reutilización y claridad
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur transition-colors duration-300">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        
        {/* ✅ Left Section */}
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
            <h1 className="text-sm font-semibold leading-tight truncate">
              Gestión - Inventario
            </h1>
            <p className="text-[11px] opacity-70 leading-tight">
              Panel de administración
            </p>
          </div>
        </div>

        {/* ✅ Right Section */}
        <div className="flex items-center gap-2">
          
          {/* Theme Toggle - Mejorado con animación y accesibilidad */}
          <button
            onClick={toggleTheme}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-1.5 text-xs hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-200"
            aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
            title={`Tema actual: ${isDark ? "Oscuro" : "Claro"}`}
          >
            <span className="relative flex items-center justify-center w-4 h-4">
              {/* Animación suave entre iconos */}
              <span className={`absolute transition-all duration-200 ${isDark ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`}>
                <SunIcon />
              </span>
              <span className={`absolute transition-all duration-200 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"}`}>
                <MoonIcon />
              </span>
            </span>
            <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
          </button>

          {/* Year - Accesible */}
          <time className="hidden sm:block text-xs opacity-70" dateTime="2026">
            2026
          </time>

          {/* User Avatar - Mejorado con fallback y accesibilidad */}
          <button 
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-muted)] ring-1 ring-[var(--color-border)] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-opacity"
            aria-label="Abrir menú de usuario"
          >
            <UserIcon />
          </button>
        </div>
      </div>
    </header>
  );
}