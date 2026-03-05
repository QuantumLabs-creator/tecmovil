"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyThemeToHtml(theme: Theme) {
    // Asignación directa es más eficiente aquí
    document.documentElement.className = theme;
}

// Función helper para obtener el tema inicial (segura para SSR)
function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "light";

    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) return saved;

    // Respetar preferencia del sistema si no hay guardado
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // ✅ Lazy initializer: se ejecuta solo en el primer render del cliente
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        // Solo aplicamos al DOM cuando el contexto cambia
        applyThemeToHtml(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const setTheme = (t: Theme) => setThemeState(t);

    const toggleTheme = () => setThemeState((prev) => (prev === "light" ? "dark" : "light"));

    const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}