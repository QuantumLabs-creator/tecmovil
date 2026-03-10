// src/modules/movements/domain/movement.repository.ts

import type { Prisma, $Enums } from "@/src/generated/prisma/client";

export type MovementRecord = {
  id: string;
  type: $Enums.MovementType;
  quantity: number;

  stockBefore: number;
  stockAfter: number;

  reason: string | null;
  unitPrice: Prisma.Decimal | null;
  reference: string | null;

  createdAt: Date;

  productId: string;
  userId: string;

  product: { id: string; code: string; name: string };
  user: { id: string; name: string; email: string };
};

export type MovementListParams = {
  productId?: string;
  userId?: string;
  type?: $Enums.MovementType;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};

export type MovementListResult = {
  items: MovementRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CreateMovementInput = {
  productId: string;
  type: $Enums.MovementType;
  quantity: number;
  reason?: string | null;
  unitPrice?: unknown;
  reference?: string | null;
  userId: string;
  adjustToStock?: number | null;
};

export interface MovementRepository {
  getById(id: string): Promise<MovementRecord | null>;
  list(params: MovementListParams): Promise<MovementListResult>;
  create(input: CreateMovementInput): Promise<MovementRecord>;
}