-- AlterTable
ALTER TABLE "EducationEvent" ADD COLUMN     "hostMemberId" TEXT;

-- AlterTable
ALTER TABLE "EventApplication" ADD COLUMN     "memberId" TEXT;

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'local',
    "providerAccountId" TEXT,
    "educatorStatus" TEXT NOT NULL DEFAULT 'NONE',
    "educatorRejectReason" TEXT,
    "educatorAppliedAt" TIMESTAMP(3),
    "educatorApprovedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Member_provider_providerAccountId_idx" ON "Member"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_memberId_idx" ON "EmailVerificationToken"("memberId");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_tokenHash_idx" ON "EmailVerificationToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "EducationEvent" ADD CONSTRAINT "EducationEvent_hostMemberId_fkey" FOREIGN KEY ("hostMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventApplication" ADD CONSTRAINT "EventApplication_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
