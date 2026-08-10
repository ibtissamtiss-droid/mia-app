-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetNetIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "workingDaysPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "hoursPerDay" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "monthlyExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingSettings_userId_key" ON "PricingSettings"("userId");

-- AddForeignKey
ALTER TABLE "PricingSettings" ADD CONSTRAINT "PricingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
