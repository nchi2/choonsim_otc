-- AdminUser 신청 알림 수신 종류 플래그 (추가 전용 · 기존 행 default true 유지)
ALTER TABLE "AdminUser" ADD COLUMN "alertMiracle10" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminUser" ADD COLUMN "alertOtc" BOOLEAN NOT NULL DEFAULT true;
