import type { ProductStatus } from "./product-status";
import { ProductVariantEntity } from "./product-variant.entity";

export type ProductRecord = {
  id: string;
  code: string;

  name: string;
  description: string | null;
  image: string | null;

  purchasePrice: string;
  retailPrice: string;
  wholesalePrice: string | null;
  wholesaleMinQuantity: number;

  minSalePrice: string | null;
  maxSalePrice: string | null;

  minStock: number;
  currentStock: number;
  reservedStock: number;

  hasVariants: boolean;

  // nuevos campos calculados
  pendingRequestedStock: number;
  availableRealStock: number;
  availableCommercialStock: number;

  status: ProductStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  category: { id: string; name: string };
  supplier: { id: string; name: string } | null;
  unit: { id: string; name: string; symbol: string | null };
};

export type ProductVariantRecord = {
  id: string;
  productId: string;

  color: string | null;
  size: string | null;

  sku: string | null;
  retailPrice: string | null;

  currentStock: number;
  reservedStock: number;

  status: ProductStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductListResult = {
  items: ProductRecord[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type ProductListParams = {
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
  supplierId?: string;
  unitId?: string;
  lowStock?: boolean;
  page: number;
  pageSize: number;
};

export type CreateProductInput = {
  code?: string | null;

  name: string;
  description?: string | null;
  image?: string | null;

  purchasePrice: unknown;
  retailPrice: unknown;

  wholesalePrice?: unknown;
  wholesaleMinQuantity?: unknown;

  minSalePrice?: unknown;
  maxSalePrice?: unknown;

  minStock?: unknown;
  currentStock?: unknown;
  reservedStock?: unknown;

  hasVariants?: unknown;

  status?: unknown;

  categoryId: string;
  supplierId?: string | null;
  unitId: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductRepository {
  getById(id: string): Promise<ProductRecord | null>;
  getByCode(code: string): Promise<ProductRecord | null>;
  list(params: ProductListParams): Promise<ProductListResult>;
  create(input: CreateProductInput): Promise<ProductRecord>;
  update(id: string, input: UpdateProductInput): Promise<ProductRecord>;
  archive(id: string): Promise<void>;

  existsById(id: string): Promise<boolean>;

  listVariants(productId: string, status?: ProductStatus): Promise<ProductVariantRecord[]>;
  getVariantById(id: string): Promise<ProductVariantRecord | null>;
  createVariant(entity: ProductVariantEntity): Promise<ProductVariantRecord>;
  updateVariant(
    id: string,
    data: Partial<ProductVariantEntity["props"]>
  ): Promise<ProductVariantRecord>;
  deleteVariant(id: string): Promise<void>;
  existsVariantDuplicate(params: {
    productId: string;
    color?: string | null;
    size?: string | null;
    excludeId?: string;
  }): Promise<boolean>;
}