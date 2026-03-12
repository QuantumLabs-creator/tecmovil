import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/db/prisma";

export async function GET() {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      todayMovements,
      monthMovements,
      totalUsers,
      totalAdmins,
      recentProducts,
      recentMovements,
      recentUsers,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: { active: true },
      }),
      prisma.product.count({
        where: {
          currentStock: { lte: 0 },
        },
      }),
      prisma.movement.count({
        where: {
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.movement.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: "ADMIN",
        },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
        },
      }),
      prisma.movement.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          quantity: true,
          createdAt: true,
          product: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    const activity = [
      ...recentProducts.map((p) => ({
        id: `product-${p.id}`,
        type: "PRODUCT" as const,
        title: `Producto creado: ${p.name}`,
        subtitle: p.code ? `Código: ${p.code}` : undefined,
        at: p.createdAt.toISOString(),
      })),

      ...recentMovements.map((m) => ({
        id: `movement-${m.id}`,
        type: m.type === "IN" ? ("MOVE_IN" as const) : ("MOVE_OUT" as const),
        title: m.type === "IN" ? "Entrada de stock" : "Salida de stock",
        subtitle: `${m.product.name} • Cantidad: ${m.quantity}`,
        at: m.createdAt.toISOString(),
      })),

      ...recentUsers.map((u) => ({
        id: `user-${u.id}`,
        type: "USER" as const,
        title: `Usuario registrado: ${u.name}`,
        subtitle: u.email,
        at: u.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      data: {
        kpis: {
          productos: {
            total: totalProducts,
            activos: activeProducts,
            sinStock: outOfStockProducts,
          },
          movimientos: {
            hoy: todayMovements,
            mes: monthMovements,
          },
          usuarios: {
            total: totalUsers,
            admins: totalAdmins,
          },
          mesActual: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        activity,
      },
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "No se pudo cargar el dashboard",
      },
      { status: 500 }
    );
  }
}