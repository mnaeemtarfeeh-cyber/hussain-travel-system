-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "passengers" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateIndex
CREATE INDEX "customers_type_idx" ON "customers"("type");
