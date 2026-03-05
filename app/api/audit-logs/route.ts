// app/api/audit-logs/route.ts
import { ok, fail } from "@/src/shared/http/api";
import { requireAuth } from "@/src/modules/auth/infrastructure/auth.guard";
import { prisma } from "@/src/shared/db/prisma";

function hasAnyRole(session: any, roles: string[]) {
  const role = String(session?.role ?? "").toUpperCase();
  return roles.includes(role);
}

function safeStr(v?: string | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth();

    // 🔒 Solo ADMIN puede ver auditoría completa
    if (!hasAnyRole(session, ["ADMIN"])) {
      return fail("No autorizado", 401);
    }

    const url = new URL(req.url);

    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(200, Math.max(5, Number(url.searchParams.get("pageSize") ?? 20)));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    const entityType = safeStr(url.searchParams.get("entityType"));
    const entityId = safeStr(url.searchParams.get("entityId"));
    const action = safeStr(url.searchParams.get("action"));
    const userId = safeStr(url.searchParams.get("userId"));

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const from = safeStr(url.searchParams.get("from"));
    const to = safeStr(url.searchParams.get("to"));

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    // 🔎 búsqueda simple (en entityType/entityId/action)
    const q = safeStr(url.searchParams.get("q"));
    if (q) {
      where.OR = [
        { entityType: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          // útil si el log está ligado a una saleOrder
          saleOrder: { select: { id: true, orderNumber: true, status: true, total: true } },
        },
      }),
    ]);

    return ok({
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (e: any) {
    const msg = e?.message ?? "Error al listar auditoría";
    const status = msg === "No autorizado" ? 401 : 400;
    return fail(msg, status);
  }
}