-- CreateTable
CREATE TABLE "product_recommendations" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "recommendedProductId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_recommendations_productId_idx" ON "product_recommendations"("productId");

-- CreateIndex
CREATE INDEX "product_recommendations_recommendedProductId_idx" ON "product_recommendations"("recommendedProductId");

-- CreateIndex
CREATE UNIQUE INDEX "product_recommendations_productId_recommendedProductId_key" ON "product_recommendations"("productId", "recommendedProductId");

-- AddForeignKey
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_recommendedProductId_fkey" FOREIGN KEY ("recommendedProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
