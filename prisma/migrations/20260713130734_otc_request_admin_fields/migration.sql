-- OtcRequest 운영자 작업 필드 — 전부 nullable, 기존 데이터 안전.
ALTER TABLE "OtcRequest" ADD COLUMN "adminMemo" TEXT;
ALTER TABLE "OtcRequest" ADD COLUMN "lastEditedBy" TEXT;
ALTER TABLE "OtcRequest" ADD COLUMN "lastEditedByName" TEXT;
ALTER TABLE "OtcRequest" ADD COLUMN "lastEditedAt" TIMESTAMP(3);
