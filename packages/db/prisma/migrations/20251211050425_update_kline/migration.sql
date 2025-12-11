/*
  Warnings:

  - You are about to drop the column `netVolume` on the `kline` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `kline` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[graduatedPoolAddress]` on the table `Token` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenMintAddress,timestamp]` on the table `kline` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `close` to the `kline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `high` to the `kline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `low` to the `kline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open` to the `kline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `kline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trades` to the `kline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volume` to the `kline` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "kline_tokenMintAddress_time_key";

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "graduatedPoolAddress" TEXT;

-- AlterTable
ALTER TABLE "kline" DROP COLUMN "netVolume",
DROP COLUMN "time",
ADD COLUMN     "close" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "high" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "low" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "open" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "trades" INTEGER NOT NULL,
ADD COLUMN     "volume" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Token_graduatedPoolAddress_key" ON "Token"("graduatedPoolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "kline_tokenMintAddress_timestamp_key" ON "kline"("tokenMintAddress", "timestamp");
