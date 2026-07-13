-- 신청 건 운영자 코멘트 + 읽음 추적 — 전부 신규 테이블 (기존 데이터 영향 없음).
CREATE TABLE "OrderComment" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "authorId" INTEGER,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),

    CONSTRAINT "OrderComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderComment_targetType_targetId_idx" ON "OrderComment"("targetType", "targetId");

ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CommentReadState" (
    "id" SERIAL NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommentReadState_adminUserId_targetType_targetId_key" ON "CommentReadState"("adminUserId", "targetType", "targetId");

ALTER TABLE "CommentReadState" ADD CONSTRAINT "CommentReadState_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
