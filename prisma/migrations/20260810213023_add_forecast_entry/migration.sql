-- CreateTable
CREATE TABLE "ForecastEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastEntry_userId_idx" ON "ForecastEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastEntry_userId_month_key" ON "ForecastEntry"("userId", "month");

-- AddForeignKey
ALTER TABLE "ForecastEntry" ADD CONSTRAINT "ForecastEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
