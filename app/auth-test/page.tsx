"use client";

import { useState } from "react";

export default function AuthTestPage() {
  const [name, setName] = useState("Alex");
  const [email, setEmail] = useState("alex@test.com");
  const [password, setPassword] = useState("Password1");
  const [role, setRole] = useState<"USER" | "SELLER">("USER");

  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  async function callApi(path: string, method: "GET" | "POST", body?: any) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include", // ✅ cookie access_token
    });

    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  }

  async function onRegister() {
    setLoading(true);
    setOut(null);
    try {
      const result = await callApi("/api/auth/register", "POST", {
        name,
        email,
        password,
        role,
      });
      setOut({ action: "register", ...result });
    } catch (e: any) {
      setOut({ action: "register", error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function onLogin() {
    setLoading(true);
    setOut(null);
    try {
      const result = await callApi("/api/auth/login", "POST", {
        email,
        password,
      });
      setOut({ action: "login", ...result });
    } catch (e: any) {
      setOut({ action: "login", error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function onMe() {
    setLoading(true);
    setOut(null);
    try {
      const result = await callApi("/api/auth/me", "GET");
      setOut({ action: "me", ...result });
    } catch (e: any) {
      setOut({ action: "me", error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Auth Test (Register/Login/Me)
      </h1>
      <p style={{ opacity: 0.75, marginBottom: 16 }}>
        Crea un usuario con <b>Register</b>, luego prueba <b>Login</b> y <b>/me</b>.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          />
        </label>

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
            autoComplete="new-password"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Role (auto-registro)</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          >
            <option value="USER">USER</option>
            <option value="SELLER">SELLER</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            disabled={loading}
            onClick={onRegister}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "..." : "Register"}
          </button>

          <button
            disabled={loading}
            onClick={onLogin}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "..." : "Login"}
          </button>

          <button
            disabled={loading}
            onClick={onMe}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "..." : "Probar /me"}
          </button>

          <a href="/" style={{ padding: "10px 0" }}>
            Inicio
          </a>
        </div>
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
        Si Register responde ok, ya creó el usuario. Si Login responde ok, debió setear
        la cookie. Luego /me debe devolverte el usuario.
      </p>
    </main>
  );
}