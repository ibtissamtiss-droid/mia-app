-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('TO_CONTACT', 'CONTACTED', 'IN_DISCUSSION', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "channel" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'TO_CONTACT',
    "notes" TEXT,
    "outreachMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prospect_userId_idx" ON "Prospect"("userId");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
