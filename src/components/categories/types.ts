export type Category = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryDraft = Omit<Category, "id" | "createdAt" | "updatedAt">;

export const emptyCategoryDraft: CategoryDraft = {
  name: "",
  description: "",
  active: true,
};