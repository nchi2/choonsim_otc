-- 전부 추가 전용 — 컬럼 삭제·데이터 변경 없음. 구버전 코드와 호환.

-- AdminUser 프로필 (계좌는 본인 전용 — profile API 외 노출 금지)
ALTER TABLE "AdminUser" ADD COLUMN "email" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "phone" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "bankName" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "bankAccountNo" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "bankAccountHolder" TEXT;

-- PaperWalletLedger 발주(ORDER) — 재고 계산 미포함, 기록 전용
ALTER TABLE "PaperWalletLedger" ADD COLUMN "status" TEXT;
ALTER TABLE "PaperWalletLedger" ADD COLUMN "expectedDate" TIMESTAMP(3);
ALTER TABLE "PaperWalletLedger" ADD COLUMN "linkedLedgerId" INTEGER;
CREATE INDEX "PaperWalletLedger_type_status_idx" ON "PaperWalletLedger"("type", "status");

-- isTest 플래그 (기존 행 전부 false — 현행 동작 불변)
ALTER TABLE "OtcOrder" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OtcRequest" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;

-- 인덱스
CREATE INDEX "OtcOrder_kind_status_idx" ON "OtcOrder"("kind", "status");
CREATE INDEX "OtcOrder_visitDate_idx" ON "OtcOrder"("visitDate");
CREATE INDEX "OtcOrder_reservedStart_idx" ON "OtcOrder"("reservedStart");
CREATE INDEX "OtcOrder_isTest_idx" ON "OtcOrder"("isTest");
CREATE INDEX "OtcRequest_isTest_idx" ON "OtcRequest"("isTest");
