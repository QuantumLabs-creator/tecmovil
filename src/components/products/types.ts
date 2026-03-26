export type ProductStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type Product = {
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

  pendingRequestedStock: number;
  availableRealStock: number;
  availableCommercialStock: number;

  status: ProductStatus;

  createdAt?: string;
  updatedAt?: string;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  category?: { id: string; name: string };
  supplier?: { id: string; name: string } | null;
  unit?: { id: string; name: string; symbol: string | null };
};

export type ProductDraft = {
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

  pendingRequestedStock: number;
  availableRealStock: number;
  availableCommercialStock: number;

  status: ProductStatus;

  categoryId: string;
  supplierId: string | null;
  unitId: string;

  category?: { id: string; name: string };
  supplier?: { id: string; name: string } | null;
  unit?: { id: string; name: string; symbol: string | null };
};

export const emptyProductDraft: ProductDraft = {
  code: "",
  name: "",
  description: null,
  image: null,

  purchasePrice: "",
  retailPrice: "",
  wholesalePrice: null,
  wholesaleMinQuantity: 10,

  minSalePrice: null,
  maxSalePrice: null,

  minStock: 0,
  currentStock: 0,
  reservedStock: 0,

  hasVariants: false,

  pendingRequestedStock: 0,
  availableRealStock: 0,
  availableCommercialStock: 0,

  status: "ACTIVE",

  categoryId: "",
  supplierId: null,
  unitId: "",

  category: undefined,
  supplier: null,
  unit: undefined,
};

export type ProductOption = {
  id: string;
  name: string;
  symbol?: string | null;
};