// app/auth/page.tsx
import AuthForm from "@/src/components/auth/AuthForm";
import { Suspense } from "react";


export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Cargando formulario...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}