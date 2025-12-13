/*
  Warnings:

  - You are about to drop the `kline` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "kline" DROP CONSTRAINT "kline_tokenMintAddress_fkey";

-- DropTable
DROP TABLE "kline";

-- CreateTable
CREATE TABLE "Kline" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "trades" INTEGER NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,

    CONSTRAINT "Kline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kline_tokenMintAddress_timestamp_key" ON "Kline"("tokenMintAddress", "timestamp");

-- AddForeignKey
ALTER TABLE "Kline" ADD CONSTRAINT "Kline_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "Token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
