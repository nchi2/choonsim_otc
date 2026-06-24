-- CreateTable
CREATE TABLE "OtcRequest" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "side" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "OtcRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtcRequest_status_idx" ON "OtcRequest"("status");

-- CreateIndex
CREATE INDEX "OtcRequest_createdAt_idx" ON "OtcRequest"("createdAt");

-- CreateIndex
CREATE INDEX "OtcRequest_side_idx" ON "OtcRequest"("side");
