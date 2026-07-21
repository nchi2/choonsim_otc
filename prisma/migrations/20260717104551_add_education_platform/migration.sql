-- CreateEnum
CREATE TYPE "EducationCategory" AS ENUM ('LECTURE', 'WORKSHOP', 'EVENT');

-- CreateEnum
CREATE TYPE "EducationMode" AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "EducationEventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventApplicationStatus" AS ENUM ('APPLIED', 'CANCELED');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "alertEducation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "manageEducation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "manageOtc" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "EducationEvent" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "EducationCategory" NOT NULL,
    "posterUrl" TEXT,
    "descriptionMd" TEXT,
    "instructorName" TEXT,
    "instructorBio" TEXT,
    "officeId" INTEGER,
    "customLocation" TEXT,
    "mode" "EducationMode" NOT NULL,
    "streamUrl" TEXT,
    "capacity" INTEGER,
    "feeKrw" INTEGER NOT NULL DEFAULT 0,
    "depositBankName" TEXT,
    "depositAccountNo" TEXT,
    "depositAccountHolder" TEXT,
    "eligibility" TEXT,
    "preparation" TEXT,
    "reward" TEXT,
    "refundPolicy" TEXT,
    "notice" TEXT,
    "applyDeadline" TIMESTAMP(3),
    "status" "EducationEventStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "hostName" TEXT,
    "hostContact" TEXT,
    "hostEmail" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "lastEditedBy" TEXT,
    "lastEditedByName" TEXT,
    "lastEditedAt" TIMESTAMP(3),

    CONSTRAINT "EducationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSession" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "EventSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventApplication" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "depositorName" TEXT,
    "question" TEXT,
    "agreePrivacy" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "paidConfirmedAt" TIMESTAMP(3),
    "attendedAt" TIMESTAMP(3),
    "isTest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationSlot" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officeId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "memo" TEXT,

    CONSTRAINT "EducationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducationEvent_slug_key" ON "EducationEvent"("slug");

-- CreateIndex
CREATE INDEX "EducationEvent_status_idx" ON "EducationEvent"("status");

-- CreateIndex
CREATE INDEX "EducationEvent_isPublished_idx" ON "EducationEvent"("isPublished");

-- CreateIndex
CREATE INDEX "EducationEvent_isFeatured_idx" ON "EducationEvent"("isFeatured");

-- CreateIndex
CREATE INDEX "EducationEvent_isTest_idx" ON "EducationEvent"("isTest");

-- CreateIndex
CREATE INDEX "EventSession_eventId_idx" ON "EventSession"("eventId");

-- CreateIndex
CREATE INDEX "EventSession_date_startTime_idx" ON "EventSession"("date", "startTime");

-- CreateIndex
CREATE INDEX "EventApplication_eventId_status_idx" ON "EventApplication"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventApplication_sessionId_idx" ON "EventApplication"("sessionId");

-- CreateIndex
CREATE INDEX "EventApplication_isTest_idx" ON "EventApplication"("isTest");

-- CreateIndex
CREATE INDEX "EducationSlot_officeId_date_idx" ON "EducationSlot"("officeId", "date");

-- AddForeignKey
ALTER TABLE "EducationEvent" ADD CONSTRAINT "EducationEvent_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSession" ADD CONSTRAINT "EventSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EducationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventApplication" ADD CONSTRAINT "EventApplication_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EducationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventApplication" ADD CONSTRAINT "EventApplication_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EventSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationSlot" ADD CONSTRAINT "EducationSlot_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
