/*
  Warnings:

  - You are about to drop the column `image_url` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `metadata_url` on the `Token` table. All the data in the column will be lost.
  - Added the required column `bondingCurveProgress` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "image_url",
DROP COLUMN "metadata_url",
ADD COLUMN     "bondingCurveProgress" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "liquidity" DOUBLE PRECISION,
ADD COLUMN     "marketCap" DOUBLE PRECISION,
ADD COLUMN     "metadataUrl" TEXT,
ADD COLUMN     "volume" DOUBLE PRECISION;
