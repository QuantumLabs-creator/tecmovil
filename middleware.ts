import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

type Role = "ADMIN" | "USER" | "WAREHOUSE" | "SELLER";

const RBAC: Array<{
  prefix: string;
  roles: Role[];
  methods?: string[];
}> = [
  // Dashboard interno
  { prefix: "/dashboard", roles: ["ADMIN", "WAREHOUSE", "SELLER"] },

  // Área usuario
  { prefix: "/shop", roles: ["USER"] },
  { prefix: "/my-orders", roles: ["USER"] },
  { prefix: "/profile", roles: ["USER"] },

  // Products:
  // ✅ USER puede leer productos
  { prefix: "/api/products", roles: ["ADMIN", "WAREHOUSE", "USER", "SELLER"], methods: ["GET"] },
  // ✅ solo backoffice puede modificarlos
  { prefix: "/api/products", roles: ["ADMIN", "WAREHOUSE"], methods: ["POST", "PATCH", "PUT", "DELETE"] },

  { prefix: "/api/receipts", roles: ["ADMIN", "WAREHOUSE", "SELLER", "USER"] },

  { prefix: "/api/categories", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/units", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/suppliers", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/movements", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/users", roles: ["ADMIN"] },

  // Pedidos de venta
  { prefix: "/api/sale-orders", roles: ["ADMIN", "WAREHOUSE", "SELLER", "USER"] },
];

function matchRule(pathname: string, method: string) {
  return RBAC.find((r) => {
    const prefixMatch = pathname.startsWith(r.prefix);
    const methodMatch = !r.methods || r.methods.includes(method);
    return prefixMatch && methodMatch;
  });
}

function getHomeByRole(role: Role) {
  return role === "USER" ? "/shop" : "/dashboard";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/auth")
  ) {
    return NextResponse.next();
  }

  const rule = matchRule(pathname, method);
  if (!rule) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
    }

    const loginUrl = new URL("/auth", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ ok: false, message: "JWT_SECRET no configurado" }, { status: 500 });
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const role = payload.role as Role | undefined;

    if (!role) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    if (!rule.roles.includes(role)) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 403 });
      }

      return NextResponse.redirect(new URL(getHomeByRole(role), req.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ ok: false, message: "Token inválido" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/auth", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/shop/:path*",
    "/my-orders/:path*",
    "/profile/:path*",
    "/api/:path*",
  ],
};