export type Unit = {
  id: string;
  name: string;
  symbol: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UnitDraft = Omit<Unit, "id" | "createdAt" | "updatedAt">;

export const emptyUnitDraft: UnitDraft = {
  name: "",
  symbol: "",
  active: true,
};