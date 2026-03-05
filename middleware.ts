import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

type Role = "ADMIN" | "USER" | "WAREHOUSE" | "SELLER";

const RBAC: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/dashboard", roles: ["ADMIN", "USER", "WAREHOUSE", "SELLER"] },
  { prefix: "/api/products", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/categories", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/units", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/suppliers", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/movements", roles: ["ADMIN", "WAREHOUSE"] },
  { prefix: "/api/users", roles: ["ADMIN"] },
];

function matchRule(pathname: string) {
  return RBAC.find((r) => pathname.startsWith(r.prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // rutas públicas
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  const rule = matchRule(pathname);
  if (!rule) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ ok: false, message: "JWT_SECRET no configurado" }, { status: 500 });
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const role = payload.role as Role | undefined;

    if (!role || !rule.roles.includes(role)) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
  matcher: ["/dashboard/:path*", "/api/:path*"],
};