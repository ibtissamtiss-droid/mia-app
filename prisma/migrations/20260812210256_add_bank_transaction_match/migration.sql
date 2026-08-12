-- AlterTable
ALTER TABLE "BankTransaction" ADD COLUMN     "matchedDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "BankTransaction_matchedDocumentId_idx" ON "BankTransaction"("matchedDocumentId");

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_matchedDocumentId_fkey" FOREIGN KEY ("matchedDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
