-- AlterTable
ALTER TABLE "OtcOrder" ADD COLUMN     "dealCoinTotalKrw" DECIMAL(18,2),
ADD COLUMN     "dealQuantity" INTEGER,
ADD COLUMN     "dealTotalKrw" DECIMAL(18,2),
ADD COLUMN     "dealUnitPriceKrw" DECIMAL(18,2),
ADD COLUMN     "dealUnitPriceUsdt" DECIMAL(18,6),
ADD COLUMN     "p2pExperienceConfirmed" BOOLEAN,
ADD COLUMN     "paperWalletCount" INTEGER,
ADD COLUMN     "paperWalletKrw" DECIMAL(18,2),
ADD COLUMN     "receiveWalletAddress" TEXT;
