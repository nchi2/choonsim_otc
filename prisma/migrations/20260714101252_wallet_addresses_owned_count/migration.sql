-- 전부 추가 전용 — 컬럼 삭제·데이터 변경 없음.
-- IN 원장: 입고 시 스캔한 지갑 주소 배열
ALTER TABLE "PaperWalletLedger" ADD COLUMN "walletAddresses" JSONB;
-- 10모: 손님 보유 종이지갑 장수 (reserved 정확도)
ALTER TABLE "OtcOrder" ADD COLUMN "ownedPaperWalletCount" INTEGER;
