/*
  Warnings:

  - You are about to alter the column `amount` on the `holder` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(38,18)`.
  - You are about to alter the column `price` on the `trade` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(38,18)`.
  - You are about to alter the column `tokenAmount` on the `trade` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(38,18)`.
  - You are about to alter the column `solAmount` on the `trade` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(38,18)`.
  - A unique constraint covering the columns `[signature,tokenMintAddress,instructionIndex]` on the table `trade` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "holder" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(38,18);

-- AlterTable
ALTER TABLE "trade" ADD COLUMN     "instructionIndex" INTEGER,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(38,18),
ALTER COLUMN "tokenAmount" SET DATA TYPE DECIMAL(38,18),
ALTER COLUMN "solAmount" SET DATA TYPE DECIMAL(38,18);

-- CreateIndex
CREATE INDEX "holder_tokenMintAddress_idx" ON "holder"("tokenMintAddress");

-- CreateIndex
CREATE INDEX "kline_tokenMintAddress_timestamp_idx" ON "kline"("tokenMintAddress", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "trade_tokenMintAddress_timestamp_idx" ON "trade"("tokenMintAddress", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "trade_signature_tokenMintAddress_instructionIndex_key" ON "trade"("signature", "tokenMintAddress", "instructionIndex");
