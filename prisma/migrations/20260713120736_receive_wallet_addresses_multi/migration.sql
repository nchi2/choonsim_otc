-- 수령 지갑주소 단일 → 다중(String[]) 전환.
-- 기존 receiveWalletAddress 값은 배열 첫 원소로 이관 후 컬럼 제거 (데이터 보존).

ALTER TABLE "OtcOrder" ADD COLUMN "receiveWalletAddresses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "OtcOrder"
SET "receiveWalletAddresses" = ARRAY["receiveWalletAddress"]
WHERE "receiveWalletAddress" IS NOT NULL
  AND btrim("receiveWalletAddress") <> '';

ALTER TABLE "OtcOrder" DROP COLUMN "receiveWalletAddress";
