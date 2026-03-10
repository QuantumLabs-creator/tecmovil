export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SupplierDraft = Omit<Supplier, "id" | "createdAt" | "updatedAt">;

export const emptySupplierDraft: SupplierDraft = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  address: "",
  active: true,
};