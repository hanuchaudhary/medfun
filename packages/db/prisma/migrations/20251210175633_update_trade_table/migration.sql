/*
  Warnings:

  - You are about to drop the column `amount` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `asset` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `isMev` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `isValidPosition` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `isValidPrice` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `nativeVolume` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `poolId` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `usdPrice` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `usdVolume` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `tokenId` on the `kline` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[signature]` on the table `Trade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenMintAddress,time]` on the table `kline` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volume` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenMintAddress` to the `kline` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "kline" DROP CONSTRAINT "kline_tokenId_fkey";

-- DropIndex
DROP INDEX "Trade_txHash_key";

-- DropIndex
DROP INDEX "kline_tokenId_time_key";

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "amount",
DROP COLUMN "asset",
DROP COLUMN "isMev",
DROP COLUMN "isValidPosition",
DROP COLUMN "isValidPrice",
DROP COLUMN "nativeVolume",
DROP COLUMN "poolId",
DROP COLUMN "txHash",
DROP COLUMN "usdPrice",
DROP COLUMN "usdVolume",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "signature" TEXT NOT NULL,
ADD COLUMN     "volume" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "kline" DROP COLUMN "tokenId",
ADD COLUMN     "tokenMintAddress" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Trade_signature_key" ON "Trade"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "kline_tokenMintAddress_time_key" ON "kline"("tokenMintAddress", "time");

-- AddForeignKey
ALTER TABLE "kline" ADD CONSTRAINT "kline_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "Token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
