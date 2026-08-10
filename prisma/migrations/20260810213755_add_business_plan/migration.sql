-- CreateTable
CREATE TABLE "BusinessPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "presentation" TEXT NOT NULL,
    "offer" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPlan_userId_key" ON "BusinessPlan"("userId");

-- AddForeignKey
ALTER TABLE "BusinessPlan" ADD CONSTRAINT "BusinessPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
