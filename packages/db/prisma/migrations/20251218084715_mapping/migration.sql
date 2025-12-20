/*
  Warnings:

  - You are about to drop the column `holderAddress` on the `holder` table. All the data in the column will be lost.
  - You are about to drop the column `tokenMintAddress` on the `holder` table. All the data in the column will be lost.
  - The primary key for the `kline` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tokenMintAddress` on the `kline` table. All the data in the column will be lost.
  - The primary key for the `token` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bondingCurveProgress` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `creatorAddress` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `graduatedPoolAddress` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `holderCount` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `isStreamLive` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `metadataUrl` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `mintAddress` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `poolAddress` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `stats1h` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `stats24h` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `stats5m` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `stats6h` on the `token` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `token` table. All the data in the column will be lost.
  - The primary key for the `trade` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `instructionIndex` on the `trade` table. All the data in the column will be lost.
  - You are about to drop the column `solAmount` on the `trade` table. All the data in the column will be lost.
  - You are about to drop the column `tokenAmount` on the `trade` table. All the data in the column will be lost.
  - You are about to drop the column `tokenMintAddress` on the `trade` table. All the data in the column will be lost.
  - You are about to drop the column `traderAddress` on the `trade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token_mint_address,holder_address]` on the table `holder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pool_address]` on the table `token` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[graduated_pool_address]` on the table `token` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `holder_address` to the `holder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_mint_address` to the `holder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_mint_address` to the `kline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_address` to the `token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mint_address` to the `token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pool_address` to the `token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sol_amount` to the `trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_amount` to the `trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_mint_address` to the `trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trader_address` to the `trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "holder" DROP CONSTRAINT "holder_tokenMintAddress_fkey";

-- DropForeignKey
ALTER TABLE "kline" DROP CONSTRAINT "kline_tokenMintAddress_fkey";

-- DropForeignKey
ALTER TABLE "trade" DROP CONSTRAINT "trade_tokenMintAddress_fkey";

-- DropIndex
DROP INDEX "holder_tokenMintAddress_holderAddress_key";

-- DropIndex
DROP INDEX "holder_tokenMintAddress_idx";

-- DropIndex
DROP INDEX "kline_tokenMintAddress_timestamp_idx";

-- DropIndex
DROP INDEX "token_graduatedPoolAddress_key";

-- DropIndex
DROP INDEX "token_mintAddress_key";

-- DropIndex
DROP INDEX "token_poolAddress_key";

-- DropIndex
DROP INDEX "trade_tokenMintAddress_timestamp_idx";

-- AlterTable
ALTER TABLE "holder" DROP COLUMN "holderAddress",
DROP COLUMN "tokenMintAddress",
ADD COLUMN     "holder_address" TEXT NOT NULL,
ADD COLUMN     "token_mint_address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "kline" DROP CONSTRAINT "kline_pkey",
DROP COLUMN "tokenMintAddress",
ADD COLUMN     "token_mint_address" TEXT NOT NULL,
ADD CONSTRAINT "kline_pkey" PRIMARY KEY ("token_mint_address", "timestamp");

-- AlterTable
ALTER TABLE "token" DROP CONSTRAINT "token_pkey",
DROP COLUMN "bondingCurveProgress",
DROP COLUMN "createdAt",
DROP COLUMN "creatorAddress",
DROP COLUMN "graduatedPoolAddress",
DROP COLUMN "holderCount",
DROP COLUMN "imageUrl",
DROP COLUMN "isStreamLive",
DROP COLUMN "metadataUrl",
DROP COLUMN "mintAddress",
DROP COLUMN "poolAddress",
DROP COLUMN "stats1h",
DROP COLUMN "stats24h",
DROP COLUMN "stats5m",
DROP COLUMN "stats6h",
DROP COLUMN "updatedAt",
ADD COLUMN     "bonding_curve_progress" DOUBLE PRECISION,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creator_address" TEXT NOT NULL,
ADD COLUMN     "graduated_pool_address" TEXT,
ADD COLUMN     "holder_count" INTEGER,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_stream_live" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata_url" TEXT,
ADD COLUMN     "mint_address" TEXT NOT NULL,
ADD COLUMN     "pool_address" TEXT NOT NULL,
ADD COLUMN     "stats_1h" JSONB,
ADD COLUMN     "stats_24h" JSONB,
ADD COLUMN     "stats_5m" JSONB,
ADD COLUMN     "stats_6h" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "token_pkey" PRIMARY KEY ("mint_address");

-- AlterTable
ALTER TABLE "trade" DROP CONSTRAINT "trade_pkey",
DROP COLUMN "instructionIndex",
DROP COLUMN "solAmount",
DROP COLUMN "tokenAmount",
DROP COLUMN "tokenMintAddress",
DROP COLUMN "traderAddress",
ADD COLUMN     "instruction_index" INTEGER,
ADD COLUMN     "sol_amount" DECIMAL(38,18) NOT NULL,
ADD COLUMN     "token_amount" DECIMAL(38,18) NOT NULL,
ADD COLUMN     "token_mint_address" TEXT NOT NULL,
ADD COLUMN     "trader_address" TEXT NOT NULL,
ADD CONSTRAINT "trade_pkey" PRIMARY KEY ("signature", "token_mint_address", "timestamp");

-- CreateIndex
CREATE INDEX "holder_token_mint_address_idx" ON "holder"("token_mint_address");

-- CreateIndex
CREATE UNIQUE INDEX "holder_token_mint_address_holder_address_key" ON "holder"("token_mint_address", "holder_address");

-- CreateIndex
CREATE INDEX "kline_token_mint_address_timestamp_idx" ON "kline"("token_mint_address", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "token_pool_address_key" ON "token"("pool_address");

-- CreateIndex
CREATE UNIQUE INDEX "token_graduated_pool_address_key" ON "token"("graduated_pool_address");

-- CreateIndex
CREATE INDEX "trade_token_mint_address_timestamp_idx" ON "trade"("token_mint_address", "timestamp");

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_token_mint_address_fkey" FOREIGN KEY ("token_mint_address") REFERENCES "token"("mint_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kline" ADD CONSTRAINT "kline_token_mint_address_fkey" FOREIGN KEY ("token_mint_address") REFERENCES "token"("mint_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holder" ADD CONSTRAINT "holder_token_mint_address_fkey" FOREIGN KEY ("token_mint_address") REFERENCES "token"("mint_address") ON DELETE RESTRICT ON UPDATE CASCADE;
