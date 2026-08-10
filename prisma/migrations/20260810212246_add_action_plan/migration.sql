-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlanStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActionPlan_userId_key" ON "ActionPlan"("userId");

-- CreateIndex
CREATE INDEX "ActionPlanStep_planId_idx" ON "ActionPlanStep"("planId");

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlanStep" ADD CONSTRAINT "ActionPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
