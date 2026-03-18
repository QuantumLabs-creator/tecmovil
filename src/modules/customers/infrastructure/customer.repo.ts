// src/modules/customers/infrastructure/customer.repo.ts

import { prisma } from "@/src/shared/db/prisma";
import type { Prisma } from "@/src/generated/prisma/client";

import type {
  CustomerRepository,
  CustomerRecord,
  CustomerListParams,
  CustomerListResult,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../domain/customer.repository";

import {
  normalizeCreateCustomer,
  normalizeUpdateCustomer,
} from "../domain/customer.rules";
import { type CustomerType, isCustomerType } from "../domain/customer-status";
import { type CustomerStatus, isCustomerStatus } from "../domain/customer-status";

/** ===================== Helpers ===================== */

function mapCustomer(c: Prisma.CustomerGetPayload<{}>): CustomerRecord {
  return {
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    document: c.document ?? null,
    customerType: c.customerType as CustomerType,
    status: c.status as CustomerStatus,
    archivedAt: c.archivedAt ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function safeStr(v?: string | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

function parseStatusFilter(v?: string): CustomerStatus | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return undefined;

  const s = String(v).trim().toUpperCase();
  if (!isCustomerStatus(s)) throw new Error("status inválido");
  if (s === "ARCHIVED") throw new Error("No se permite buscar clientes archivados");

  return s;
}

function parseCustomerTypeFilter(v?: string): CustomerType | undefined {
  const s = safeStr(v)?.toUpperCase();
  if (!s) return undefined;
  if (!isCustomerType(s)) throw new Error("customerType inválido");
  return s;
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

  async getByDocument(document: string): Promise<CustomerRecord | null> {
    const d = String(document ?? "").trim();
    if (!d) return null;

    const c = await prisma.customer.findFirst({
      where: { document: d },
    });

    return c ? mapCustomer(c) : null;
  }

  async list(params: CustomerListParams): Promise<CustomerListResult> {
    const q = String(params.q ?? "").trim();
    const page = Math.max(1, Number(params.page ?? 1));
    const pageSize = Math.min(500, Math.max(5, Number(params.pageSize ?? 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {};

    const status = parseStatusFilter(params.status as string | undefined);
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["ACTIVE", "INACTIVE"] };
    }

    const customerType = parseCustomerTypeFilter(params.customerType as string | undefined);
    if (customerType) {
      where.customerType = customerType;
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
    const normalized = normalizeCreateCustomer(input);

    if (normalized.email) {
      const exists = await prisma.customer.findUnique({
        where: { email: normalized.email },
      });
      if (exists) throw new Error("Ya existe un cliente con ese email");
    }

    if (normalized.document) {
      const exists = await prisma.customer.findFirst({
        where: { document: normalized.document },
        select: { id: true },
      });
      if (exists) throw new Error("Ya existe un cliente con ese documento");
    }

    const created = await prisma.customer.create({
      data: {
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        document: normalized.document,
        customerType: normalized.customerType,
        status: normalized.status,
        archivedAt: normalized.status === "ARCHIVED" ? new Date() : null,
      },
    });

    return mapCustomer(created);
  }

  async update(id: string, input: UpdateCustomerInput): Promise<CustomerRecord> {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new Error("Cliente no encontrado");

    const normalized = normalizeUpdateCustomer(input);

    if (normalized.email !== undefined && normalized.email) {
      const exists = await prisma.customer.findUnique({
        where: { email: normalized.email },
      });
      if (exists && exists.id !== id) {
        throw new Error("Ya existe un cliente con ese email");
      }
    }

    if (normalized.document !== undefined && normalized.document) {
      const exists = await prisma.customer.findFirst({
        where: { document: normalized.document },
        select: { id: true },
      });
      if (exists && exists.id !== id) {
        throw new Error("Ya existe un cliente con ese documento");
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(normalized.name !== undefined ? { name: normalized.name } : {}),
        ...(normalized.email !== undefined ? { email: normalized.email } : {}),
        ...(normalized.phone !== undefined ? { phone: normalized.phone } : {}),
        ...(normalized.document !== undefined ? { document: normalized.document } : {}),
        ...(normalized.customerType !== undefined
          ? { customerType: normalized.customerType }
          : {}),
        ...(normalized.status !== undefined
          ? {
              status: normalized.status,
              archivedAt:
                normalized.status === "ARCHIVED" ? new Date() : null,
            }
          : {}),
      },
    });

    return mapCustomer(updated);
  }

  async archive(id: string): Promise<void> {
    const c = await prisma.customer.findUnique({ where: { id } });
    if (!c) return;

    if (c.status === "ARCHIVED") return;

    await prisma.customer.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }
}