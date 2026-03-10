export type Product = {
  id: string;
  code: string;
  name: string;
  description: string;
  image: string;

  purchasePrice: string;
  retailPrice: string;
  wholesalePrice: string;
  wholesaleMinQuantity: number;

  minSalePrice: string;
  maxSalePrice: string;

  minStock: number;
  currentStock: number;
  reservedStock: number;

  active: boolean;
  createdAt?: string;
  updatedAt?: string;

  categoryId: string;
  supplierId: string;
  unitId: string;

  category?: { id: string; name: string };
  supplier?: { id: string; name: string } | null;
  unit?: { id: string; name: string; symbol: string | null };
};

export type ProductDraft = Omit<Product, "id" | "createdAt" | "updatedAt">;

export const emptyProductDraft: ProductDraft = {
  code: "",
  name: "",
  description: "",
  image: "",

  purchasePrice: "",
  retailPrice: "",
  wholesalePrice: "",
  wholesaleMinQuantity: 10,

  minSalePrice: "",
  maxSalePrice: "",

  minStock: 0,
  currentStock: 0,
  reservedStock: 0,

  active: true,

  categoryId: "",
  supplierId: "",
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