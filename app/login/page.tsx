"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("alex@test.com");
  const [password, setPassword] = useState("Password1");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOut(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ importantísimo para cookies (aunque sea same-origin)
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => null);
      setOut({ status: res.status, json });
    } catch (err: any) {
      setOut({ error: err?.message ?? String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function onMe() {
    setLoading(true);
    setOut(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      const json = await res.json().catch(() => null);
      setOut({ status: res.status, json });
    } catch (err: any) {
      setOut({ error: err?.message ?? String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Login (Test)</h1>

      <form onSubmit={onLogin} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            autoComplete="email"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            autoComplete="current-password"
          />
        </label>

        <button
          disabled={loading}
          type="submit"
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button
          disabled={loading}
          onClick={onMe}
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Probar /me
        </button>

        <a href="/" style={{ padding: 10, display: "inline-block" }}>
          Ir a inicio
        </a>
      </div>

      <pre
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 12,
          background: "#f6f6f6",
          overflowX: "auto",
          fontSize: 12,
        }}
      >
        {out ? JSON.stringify(out, null, 2) : "Sin respuesta aún"}
      </pre>

      <p style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
        Tip: después de Login, dale a <b>Probar /me</b>. Si la cookie se guardó,
        /me debe responder con el usuario.
      </p>
    </main>
  );
}