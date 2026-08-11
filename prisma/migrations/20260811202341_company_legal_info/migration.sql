-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyAddress" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "siren" TEXT,
ADD COLUMN     "vatApplicable" BOOLEAN NOT NULL DEFAULT false;
