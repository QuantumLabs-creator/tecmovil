import type { Prisma, CustomerType, PricingType, SaleOrderStatus } from "@/src/generated/prisma/client";

export type SaleOrderDetailRecord = {
  id: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  productId: string;
  product: { id: string; code: string; name: string };
  productSnapshot: any | null;
};

export type SaleOrderRecord = {
  id: string;
  orderNumber: string;
  status: SaleOrderStatus;

  customerType: CustomerType;
  pricingApplied: PricingType;

  total: Prisma.Decimal;
  orderDate: Date;
  deliveryDate: Date | null;
  completedDate: Date | null;
  observations: string | null;
  createdAt: Date;

  userId: string | null;
  user: { id: string; name: string; email: string } | null;

  customerId: string | null;
  customer: { id: string; name: string; email: string | null } | null;

  sellerId: string | null;
  seller: { id: string; name: string; email: string } | null;

  details: SaleOrderDetailRecord[];
};

export type SaleOrderListResult = {
  items: SaleOrderRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type SaleOrderListParams = {
  q?: string;
  status?: string;
  mine?: boolean;
  userId?: string;
  customerId?: string;
  sellerId?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};

export type CreateSaleOrderInput = {
  userId?: string | null;
  customerId?: string | null;
  customerType: CustomerType;
  sellerId?: string | null;
  observations?: string | null;

  items: { productId: string; quantity: number }[];
};

export interface SaleOrderRepository {
  getById(id: string): Promise<SaleOrderRecord | null>;
  list(params: SaleOrderListParams): Promise<SaleOrderListResult>;

  createRequest(input: CreateSaleOrderInput, actorUserId: string): Promise<SaleOrderRecord>;

  approve(id: string, adminId: string): Promise<SaleOrderRecord>;
  reject(id: string, adminId: string, reason: string): Promise<SaleOrderRecord>;
  cancel(id: string, actorId: string, reason: string): Promise<SaleOrderRecord>;

  setStatus(id: string, actorId: string, status: "PREPARING" | "READY" | "COMPLETED"): Promise<SaleOrderRecord>;
}