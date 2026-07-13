-- 수령 지갑주소 String[] → JSON [{address, isOurs}] 전환.
-- 기존 주소는 isOurs=true(우리 지갑) 기본으로 이관 후 배열 컬럼 제거 (데이터 보존).

ALTER TABLE "OtcOrder" ADD COLUMN "receiveWallets" JSONB NOT NULL DEFAULT '[]';

UPDATE "OtcOrder"
SET "receiveWallets" = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('address', a, 'isOurs', true)),
    '[]'::jsonb
  )
  FROM unnest("receiveWalletAddresses") AS a
)
WHERE array_length("receiveWalletAddresses", 1) > 0;

ALTER TABLE "OtcOrder" DROP COLUMN "receiveWalletAddresses";
