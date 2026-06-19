-- AlterTable
ALTER TABLE "OtcOrder" ADD COLUMN     "assignedAdminUserId" INTEGER,
ADD COLUMN     "officeId" INTEGER,
ADD COLUMN     "reservedStart" TEXT;

-- CreateTable
CREATE TABLE "Office" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSlot" (
    "id" SERIAL NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "officeId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Office_code_key" ON "Office"("code");

-- CreateIndex
CREATE INDEX "WorkSlot_officeId_date_idx" ON "WorkSlot"("officeId", "date");

-- CreateIndex
CREATE INDEX "WorkSlot_date_startTime_idx" ON "WorkSlot"("date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSlot_adminUserId_officeId_date_startTime_key" ON "WorkSlot"("adminUserId", "officeId", "date", "startTime");

-- AddForeignKey
ALTER TABLE "WorkSlot" ADD CONSTRAINT "WorkSlot_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSlot" ADD CONSTRAINT "WorkSlot_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtcOrder" ADD CONSTRAINT "OtcOrder_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtcOrder" ADD CONSTRAINT "OtcOrder_assignedAdminUserId_fkey" FOREIGN KEY ("assignedAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
