"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, memo, useCallback } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  Plus,
  ArrowUpDown,
  History,
  Users,
  ChevronRight,
  ChevronsLeft,
} from "lucide-react";

// ============================================================================
// ✅ UTILS: Helper para clases (evita dependencias externas)
// ============================================================================
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// ✅ ICON SYSTEM: Memoizado para evitar re-renders
// ============================================================================
type IconProps = { active: boolean; className?: string };

function IconWrap({ children, active, className }: { children: ReactNode; active: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition-colors duration-200",
        active
          ? "bg-[var(--color-muted)] ring-[var(--color-border)]"
          : "bg-[var(--color-surface)] ring-[var(--color-border)] opacity-80 group-hover:opacity-100",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Factory memoizado para convertir iconos de Lucide al contrato del sistema.
 * Usa React.memo para que el componente no se recree en cada render del padre.
 */
function createNavIcon(Icon: ComponentType<any>, size = 18) {
  return memo(function LucideNavIcon({ active, className }: IconProps) {
    return (
      <IconWrap active={active} className={className}>
        <Icon size={size} className={cn("transition-colors", active ? "text-[var(--color-primary)]" : "text-current")} />
      </IconWrap>
    );
  });
}

// ============================================================================
// ✅ CONFIGURACIÓN DE NAVEGACIÓN
// ============================================================================
type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
  roles?: string[];
};

type NavLink = {
  type: "link";
  key: string;
  label: string;
  icon: ComponentType<IconProps>;
  href: string;
  roles?: string[];
};

type NavGroup = {
  type: "group";
  key: string;
  label: string;
  icon: ComponentType<IconProps>;
  items: NavItem[];
  roles?: string[];
};

type NavNode = NavLink | NavGroup;

// Definición de iconos fuera del render para estabilidad
const Icons = {
  Dashboard: createNavIcon(LayoutDashboard),
  Package: createNavIcon(Package),
  Plus: createNavIcon(Plus),
  History: createNavIcon(History),
  Users: createNavIcon(Users),
  ArrowUpDown: createNavIcon(ArrowUpDown),
};

const navTree: NavNode[] = [
  {
    type: "link",
    key: "dashboard",
    label: "Dashboard",
    icon: Icons.Dashboard,
    href: "/dashboard",
  },
  {
    type: "group",
    key: "products",
    label: "Inventario",
    icon: Icons.Package,
    items: [
      { href: "/dashboard/products", label: "Productos", icon: Icons.Package },
      { href: "/dashboard/categories", label: "Categorías", icon: Icons.Package },
      { href: "/dashboard/units", label: "Unidades", icon: Icons.Package },
      { href: "/dashboard/suppliers", label: "Proveedores", icon: Icons.Package },
    ],
  },
  {
    type: "group",
    key: "movements",
    label: "Movimientos",
    icon: Icons.ArrowUpDown,
    items: [
      { href: "/dashboard/movements/new", label: "Nuevo Movimiento", icon: Icons.Plus },
      { href: "/dashboard/movements/history", label: "Historial", icon: Icons.History },
    ],
  },
  {
    type: "group",
    key: "sales",
    label: "Ventas",
    icon: Icons.Package,
    roles: ["ADMIN", "SELLER"],
    items: [
      { href: "/dashboard/sale-orders", label: "Pedidos", icon: Icons.Package },
    ],
  },
  {
    type: "group",
    key: "users",
    label: "Usuarios",
    icon: Icons.Users,
    roles: ["ADMIN"],
    items: [
      { href: "/dashboard/users", label: "Gestión de Usuarios", icon: Icons.Users },
    ],
  },
];

// ============================================================================
// ✅ COMPONENTE PRINCIPAL
// ============================================================================
type Props = {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
  roles?: string[];
};

export default function Sidebar({ onNavigate, collapsed = false, onToggle, roles = [] }: Props) {
  const pathname = usePathname();

  console.log("roles prop:", roles);
console.log("pathname:", pathname);
  // ✅ Filtro por roles optimizado
  const visibleTree = useMemo(() => {
    const canSee = (allowed?: string[]) => !allowed || allowed.length === 0 || allowed.some((r) => roles.includes(r));



    return navTree
      .filter((n) => canSee(n.roles))
      .map((n) => {
        if (n.type === "group") {
          return { ...n, items: n.items.filter((it) => canSee(it.roles)) };
        }
        return n;
      })
      .filter((n) => n.type !== "group" || n.items.length > 0);
  }, [roles]);

  // ✅ Detectar grupo activo para auto-expandir
  const activeGroupKey = useMemo(() => {
    if (!pathname) return null;
    const found = visibleTree.find((n) => {
      if (n.type === "group") return n.items.some((it) => isActive(pathname, it.href));
      return isActive(pathname, n.href);
    });
    return found?.type === "group" ? found.key : null;
  }, [pathname, visibleTree]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Sincronizar grupo activo con estado de apertura
  useEffect(() => {
    if (activeGroupKey) {
      setOpenGroups((prev) => ({ ...prev, [activeGroupKey]: true }));
    }
  }, [activeGroupKey]);

  // Cerrar todo si está colapsado
  useEffect(() => {
    if (collapsed) setOpenGroups({});
  }, [collapsed]);

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-dvh border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => onToggle?.()}
        aria-label={collapsed ? "Expandir sidebar" : "Contraer sidebar"}
        aria-expanded={!collapsed}
        className={cn(
          "z-[200] absolute -right-3 top-10 z-20 flex h-6 w-6 items-center justify-center rounded-full",
          "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md",
          "hover:bg-[var(--color-muted)] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        )}
      >
        <ChevronsLeft size={14} className={cn("transition-transform duration-300", collapsed ? "rotate-180" : "")} />
      </button>

      {/* Brand Header */}
      <div className={cn("flex items-center border-b border-[var(--color-border)] px-4", collapsed ? "justify-center py-4" : "gap-3 py-4")}>
        {/* Logo Placeholder */}
        <div className={cn("flex-shrink-0 rounded-lg bg-[var(--color-muted)]", collapsed ? "h-8 w-8" : "h-10 w-10")} />

        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <h1 className="text-sm font-semibold leading-tight truncate">Gestión Inventarios</h1>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation Area */}
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin", collapsed ? "px-1" : "px-3")}>
        <nav className="space-y-1">
          {visibleTree.map((node) => {
            if (node.type === "link") {
              return <SidebarLink key={node.key} item={node} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />;
            }
            return (
              <SidebarGroup
                key={node.key}
                group={node}
                pathname={pathname}
                collapsed={collapsed}
                isOpen={!!openGroups[node.key]}
                onToggle={() => toggleGroup(node.key)}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// ============================================================================
// ✅ SUBCOMPONENTES (Extraídos para limpieza y performance)
// ============================================================================

function SidebarLink({ item, pathname, collapsed, onNavigate }: { item: NavLink; pathname: string | null; collapsed: boolean; onNavigate?: () => void }) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        " group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
        collapsed ? "justify-center px-2" : "",
        active
          ? "bg-[var(--color-muted)] text-[var(--color-primary)] ring-1 ring-[var(--color-border)]"
          : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
      )}
      aria-current={active ? "page" : undefined}
    >
      <item.icon active={active} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function SidebarGroup({
  group,
  pathname,
  collapsed,
  isOpen,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string | null;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const hasActiveChild = group.items.some((it) => isActive(pathname, it.href));
  const Icon = group.icon;

  if (collapsed) {
    // ✅ Modo Colapsado: Tooltip nativo + Submenú en popover (hover/focus)
    return (
      <div className="relative group/sub">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "group flex w-full items-center justify-center rounded-xl px-2 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
            hasActiveChild
              ? "bg-[var(--color-muted)] ring-1 ring-[var(--color-border)]"
              : "hover:bg-[var(--color-muted)]"
          )}
          aria-label={group.label}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Icon active={hasActiveChild} />
        </button>

        {/* Popover Submenu - Accesible con hover y focus */}
        <div
          className={cn(
            "absolute left-full top-0 z-50 ml-2 w-56 origin-top-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl transition-all",
            "opacity-0 invisible scale-95 group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:scale-100",
            "focus-within:opacity-100 focus-within:visible focus-within:scale-100"
          )}
          role="menu"
        >
          <div className="px-2 pb-2 text-xs font-semibold text-[var(--color-muted-foreground)] border-b border-[var(--color-border)] mb-1">
            {group.label}
          </div>
          <div className="space-y-1">
            {group.items.map((item) => {
              const itemActive = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    itemActive
                      ? "bg-[var(--color-muted)] text-[var(--color-primary)]"
                      : "hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                  )}
                  role="menuitem"
                >
                  <item.icon active={itemActive} className="h-7 w-7" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Modo Expandido: Acordeón normal
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "z-[200] group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
          hasActiveChild
            ? "bg-[var(--color-muted)] text-[var(--color-primary)] ring-1 ring-[var(--color-border)]"
            : "hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
        )}
        aria-expanded={isOpen}
        aria-controls={`group-${group.key}`}
      >
        <div className="flex items-center gap-3">
          <Icon active={hasActiveChild} />
          <span className="truncate">{group.label}</span>
        </div>
        <ChevronRight
          size={16}
          className={cn("text-[var(--color-muted-foreground)] transition-transform duration-200", isOpen && "rotate-90")}
        />
      </button>

      {isOpen && (
        <div id={`group-${group.key}`} className="ml-4 space-y-1 border-l border-[var(--color-border)] pl-3">
          {group.items.map((item) => {
            const itemActive = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  itemActive
                    ? "bg-[var(--color-muted)] text-[var(--color-primary)] font-medium"
                    : "hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                )}
              >
                <item.icon active={itemActive} className="h-7 w-7" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ✅ HELPERS
// ============================================================================
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;
  // Evitar falsos positivos: /dashboard/products no debe activar /dashboard/productos-edit
  if (href !== "/dashboard" && pathname.startsWith(href)) {
    const nextChar = pathname[href.length];
    return !nextChar || nextChar === "/";
  }
  return false;
}