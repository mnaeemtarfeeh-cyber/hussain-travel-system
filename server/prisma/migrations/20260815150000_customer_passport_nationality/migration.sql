-- DropIndex
DROP INDEX IF EXISTS "customers_type_idx";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "type",
DROP COLUMN "companyName",
ADD COLUMN     "passportId" TEXT,
ADD COLUMN     "nationality" TEXT;

-- DropEnum
DROP TYPE "CustomerType";
