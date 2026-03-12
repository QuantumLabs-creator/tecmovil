// app/auth/AuthForm.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Package, AlertCircle, User } from "lucide-react";
import { loginApi, registerApi, ensureSession, meApi } from "@/src/lib/api/auth";

type AuthMode = "login" | "register";
type FormErrors = Partial<Record<"email" | "password" | "name" | "general", string>>;

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Ahora sí puede usarse aquí

  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const nextPath = searchParams.get("next") || "/dashboard";

  // ... (todo el resto de tu lógica: updateField, validateForm, handleSubmit, etc.)
  // 👇 Copia aquí TODO el código de tu componente actual, desde `const updateField` hasta el `return (...)`

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    if (mode === "register" && form.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      newErrors.email = "Email inválido";
    }
    if (form.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }
    return newErrors;
  };

  const resetForModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setForm({ name: "", email: form.email, password: "" });
    setShowPassword(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        await loginApi({ email: form.email.trim(), password: form.password });
        const session = await ensureSession();
        if (!session) throw new Error("No se pudo validar la sesión");
        const me = await meApi();
        const role = me.data?.user?.role;
        router.replace(role === "USER" ? "/shop" : "/dashboard");
        router.refresh();
        return;
      }
      await registerApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setMode("login");
      setErrors({});
      setForm((prev) => ({ ...prev, name: "", password: "" }));
    } catch (err: any) {
      setErrors({ general: err?.error || err?.message || "Ocurrió un error inesperado" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-4">
      {/* 👇 PEGA AQUÍ TODO EL JSX DE TU COMPONENTE ORIGINAL */}
      {/* ... (todo el return con el formulario) */}
      <div className="w-full max-w-[420px] rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-4">
            <Package className="w-6 h-6 text-slate-900 dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {mode === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {mode === "login"
              ? "Ingresa tus credenciales para acceder"
              : "Completa el formulario para registrarte"}
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={[
                    "w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 transition-all",
                    errors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "",
                  ].join(" ")}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={[
                  "w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 transition-all",
                  errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "",
                ].join(" ")}
                placeholder="tu@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className={[
                  "w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 transition-all",
                  errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "",
                ].join(" ")}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {mode === "login" && (
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900" />
                Procesando...
              </span>
            ) : mode === "login" ? (
              "Iniciar sesión"
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500">
              o continuar con
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
            title="Aún no implementado"
          >
            Google
          </button>
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
            title="Aún no implementado"
          >
            GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => resetForModeChange(mode === "login" ? "register" : "login")}
            className="font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700 dark:text-white dark:hover:text-slate-200 transition-colors"
          >
            {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        Al continuar, aceptas nuestros{" "}
        <Link href="/terms" className="text-slate-600 hover:underline dark:text-slate-300">
          Términos
        </Link>{" "}
        y{" "}
        <Link href="/privacy" className="text-slate-600 hover:underline dark:text-slate-300">
          Política de Privacidad
        </Link>
        .
      </p>
    </div>
  );
}