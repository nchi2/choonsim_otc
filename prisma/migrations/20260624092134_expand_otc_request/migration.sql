-- AlterTable
ALTER TABLE "OtcRequest" ADD COLUMN     "bankInfo" TEXT,
ADD COLUMN     "customerBankInfo" TEXT,
ADD COLUMN     "desiredPrice" INTEGER,
ADD COLUMN     "officeId" INTEGER,
ADD COLUMN     "receiveAddress" TEXT,
ADD COLUMN     "reservedStart" TEXT,
ADD COLUMN     "senderAddress" TEXT,
ADD COLUMN     "visitDate" TEXT;

-- AddForeignKey
ALTER TABLE "OtcRequest" ADD CONSTRAINT "OtcRequest_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;
