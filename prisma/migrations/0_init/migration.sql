-- CreateEnum
CREATE TYPE "OrderKind" AS ENUM ('MIRACLE10', 'OTC');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('COIN', 'PAPER');

-- CreateEnum
CREATE TYPE "AssetSymbol" AS ENUM ('BMB', 'BTC', 'SBMB');

-- CreateEnum
CREATE TYPE "SettleMethod" AS ENUM ('KRW_TRANSFER', 'KRW_CASH', 'COIN_SWAP', 'UNDECIDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONTACTED', 'VERIFIED', 'COMPLETED', 'CANCELED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtcOrder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kind" "OrderKind" NOT NULL,
    "side" "OrderSide" NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "asset" "AssetSymbol",
    "denomination" INTEGER,
    "interest" DECIMAL(18,4),
    "premium" DECIMAL(18,4),
    "settle" "SettleMethod" NOT NULL DEFAULT 'UNDECIDED',
    "quantity" INTEGER NOT NULL,
    "desiredPrice" DECIMAL(18,2),
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "contactTimePref" TEXT,
    "visitType" TEXT,
    "visitDate" TEXT,
    "visitTimeSlot" TEXT,
    "needUsdt" TEXT,
    "needBmb" TEXT,
    "needFaceAuth" TEXT,
    "isSbmbMember" BOOLEAN NOT NULL DEFAULT false,
    "memo" TEXT,
    "agreePrivacy" BOOLEAN NOT NULL DEFAULT false,
    "agreeRisk" BOOLEAN NOT NULL DEFAULT false,
    "agreeP2p" BOOLEAN NOT NULL DEFAULT false,
    "customerId" INTEGER NOT NULL,

    CONSTRAINT "OtcOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_contact_key" ON "Customer"("contact");

-- CreateIndex
CREATE INDEX "OtcOrder_status_idx" ON "OtcOrder"("status");

-- CreateIndex
CREATE INDEX "OtcOrder_createdAt_idx" ON "OtcOrder"("createdAt");

-- CreateIndex
CREATE INDEX "OtcOrder_kind_idx" ON "OtcOrder"("kind");

-- CreateIndex
CREATE INDEX "OtcOrder_customerId_idx" ON "OtcOrder"("customerId");

-- AddForeignKey
ALTER TABLE "OtcOrder" ADD CONSTRAINT "OtcOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
