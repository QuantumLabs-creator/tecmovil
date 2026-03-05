// src/modules/customers/infrastructure/customer.repo.ts

import { prisma } from "@/src/shared/db/prisma";
import type { Prisma, CustomerType } from "@/src/generated/prisma/client";

import type {
  CustomerRepository,
  CustomerRecord,
  CustomerListParams,
  CustomerListResult,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../domain/customer.repository";

import { normalizeBoolean, normalizeCreateCustomer, normalizeUpdateCustomer, normalizeText } from "../domain/customer.rules";

/** ===================== Helpers ===================== */

function mapCustomer(c: Prisma.CustomerGetPayload<{}>): CustomerRecord {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    document: c.document ?? null,
    customerType: c.customerType as CustomerType,
    active: c.active,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function safeStr(v?: string | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

function parseActiveFilter(v?: string): boolean | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;
  return normalizeBoolean(v, true);
}

/** ===================== Repository ===================== */

export class PrismaCustomerRepository implements CustomerRepository {
  async getById(id: string): Promise<CustomerRecord | null> {
    const c = await prisma.customer.findUnique({ where: { id } });
    return c ? mapCustomer(c) : null;
  }

  async getByEmail(email: string): Promise<CustomerRecord | null> {
    const e = String(email ?? "").trim().toLowerCase();
    if (!e) return null;

    const c = await prisma.customer.findUnique({ where: { email: e } });
    return c ? mapCustomer(c) : null;
  }

  async list(params: CustomerListParams): Promise<CustomerListResult> {
    const q = (params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {};

    const active = parseActiveFilter(params.active);
    if (active !== undefined) where.active = active;

    const ct = safeStr(params.customerType)?.toUpperCase();
    if (ct === "RETAIL" || ct === "WHOLESALE") {
      where.customerType = ct as any;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { document: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map(mapCustomer),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async create(input: CreateCustomerInput): Promise<CustomerRecord> {
    // Reutilizamos normalización de dominio
    const normalized = normalizeCreateCustomer(input);

    // Validación: si email viene, evita colisión con unique
    if (normalized.email) {
      const exists = await prisma.customer.findUnique({ where: { email: normalized.email } });
      if (exists) throw new Error("Ya existe un cliente con ese email");
    }

    const created = await prisma.customer.create({
      data: {
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        document: normalized.document,
        customerType: normalized.customerType,
        active: normalized.active,
      },
    });

    return mapCustomer(created);
  }

  async update(id: string, input: UpdateCustomerInput): Promise<CustomerRecord> {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new Error("Cliente no encontrado");

    const normalized = normalizeUpdateCustomer(input);

    // Si intenta setear email, validar unique
    if (normalized.email !== undefined && normalized.email) {
      const exists = await prisma.customer.findUnique({ where: { email: normalized.email } });
      if (exists && exists.id !== id) throw new Error("Ya existe un cliente con ese email");
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(normalized.name !== undefined ? { name: normalized.name } : {}),
        ...(normalized.email !== undefined ? { email: normalized.email } : {}),
        ...(normalized.phone !== undefined ? { phone: normalized.phone } : {}),
        ...(normalized.document !== undefined ? { document: normalized.document } : {}),
        ...(normalized.customerType !== undefined ? { customerType: normalized.customerType } : {}),
        ...(normalized.active !== undefined ? { active: normalized.active } : {}),
      },
    });

    return mapCustomer(updated);
  }

  async delete(id: string): Promise<void> {
    const c = await prisma.customer.findUnique({ where: { id } });
    if (!c) return;

    await prisma.customer.update({
      where: { id },
      data: { active: false },
    });
  }
}