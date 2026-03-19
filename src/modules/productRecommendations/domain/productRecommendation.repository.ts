export type ProductRecommendationRecord = {
  id: string;
  productId: string;
  recommendedProductId: string;
  priority: number;
  createdAt: Date;
  recommendedProduct: {
    id: string;
    code: string;
    name: string;
    image: string | null;
    retailPrice: string;
    currentStock: number;
    reservedStock: number;
    status: string;
  };
};

export interface ProductRecommendationRepository {
  listByProduct(productId: string): Promise<ProductRecommendationRecord[]>;
  create(input: {
    productId: string;
    recommendedProductId: string;
    priority?: number;
  }): Promise<ProductRecommendationRecord>;
  delete(id: string): Promise<void>;
}