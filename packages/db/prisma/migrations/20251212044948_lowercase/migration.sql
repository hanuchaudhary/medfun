/*
  Warnings:

  - You are about to drop the `Holder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kline` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Holder" DROP CONSTRAINT "Holder_tokenMintAddress_fkey";

-- DropForeignKey
ALTER TABLE "Kline" DROP CONSTRAINT "Kline_tokenMintAddress_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_tokenMintAddress_fkey";

-- DropTable
DROP TABLE "Holder";

-- DropTable
DROP TABLE "Kline";

-- DropTable
DROP TABLE "Token";

-- DropTable
DROP TABLE "Trade";

-- CreateTable
CREATE TABLE "token" (
    "mintAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "poolAddress" TEXT NOT NULL,
    "graduatedPoolAddress" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "imageUrl" TEXT,
    "metadataUrl" TEXT,
    "creatorAddress" TEXT NOT NULL,
    "bondingCurveProgress" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "liquidity" DOUBLE PRECISION,
    "marketCap" DOUBLE PRECISION,
    "holderCount" INTEGER,
    "stats5m" JSONB,
    "stats1h" JSONB,
    "stats6h" JSONB,
    "stats24h" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_pkey" PRIMARY KEY ("mintAddress")
);

-- CreateTable
CREATE TABLE "trade" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "tokenAmount" DOUBLE PRECISION NOT NULL,
    "solAmount" DOUBLE PRECISION NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "slot" INTEGER NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,

    CONSTRAINT "trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kline" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "trades" INTEGER NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,

    CONSTRAINT "kline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holder" (
    "id" SERIAL NOT NULL,
    "holderAddress" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,

    CONSTRAINT "holder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_mintAddress_key" ON "token"("mintAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_poolAddress_key" ON "token"("poolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_graduatedPoolAddress_key" ON "token"("graduatedPoolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "kline_tokenMintAddress_timestamp_key" ON "kline"("tokenMintAddress", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "holder_tokenMintAddress_holderAddress_key" ON "holder"("tokenMintAddress", "holderAddress");

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kline" ADD CONSTRAINT "kline_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holder" ADD CONSTRAINT "holder_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
