/*
  Warnings:

  - You are about to drop the column `active` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `route_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `units_of_measure` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "active",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "active",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "active",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "route_permissions" DROP COLUMN "active",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "active",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "units_of_measure" DROP COLUMN "active",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "active",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "categories_status_idx" ON "categories"("status");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "route_permissions_status_idx" ON "route_permissions"("status");

-- CreateIndex
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

-- CreateIndex
CREATE INDEX "units_of_measure_status_idx" ON "units_of_measure"("status");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");
