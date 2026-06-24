-- AlterTable
ALTER TABLE "OtcRequest" ADD COLUMN     "sellerBankName" TEXT,
ADD COLUMN     "sellerAccountNo" TEXT,
ADD COLUMN     "sellerAccountHolder" TEXT,
ADD COLUMN     "buyerBankName" TEXT,
ADD COLUMN     "buyerAccountNo" TEXT,
ADD COLUMN     "buyerAccountHolder" TEXT;
