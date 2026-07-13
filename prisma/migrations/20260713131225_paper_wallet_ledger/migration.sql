-- 종이지갑 재고 원장 — 신규 테이블.
CREATE TABLE "PaperWalletLedger" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "entryDate" TEXT NOT NULL,
    "memo" TEXT,
    "adminUserId" INTEGER,
    "adminName" TEXT NOT NULL,
    "orderId" INTEGER,
    "receiverName" TEXT,

    CONSTRAINT "PaperWalletLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaperWalletLedger_type_idx" ON "PaperWalletLedger"("type");
CREATE INDEX "PaperWalletLedger_entryDate_idx" ON "PaperWalletLedger"("entryDate");
CREATE INDEX "PaperWalletLedger_orderId_idx" ON "PaperWalletLedger"("orderId");

ALTER TABLE "PaperWalletLedger" ADD CONSTRAINT "PaperWalletLedger_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaperWalletLedger" ADD CONSTRAINT "PaperWalletLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OtcOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
