-- CreateEnum
CREATE TYPE "UrssafPeriod" AS ENUM ('MONTHLY', 'QUARTERLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "urssafDeclarationDay" INTEGER,
ADD COLUMN     "urssafPeriod" "UrssafPeriod" NOT NULL DEFAULT 'MONTHLY';
