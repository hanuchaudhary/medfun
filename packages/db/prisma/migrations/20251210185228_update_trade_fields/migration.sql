/*
  Warnings:

  - You are about to drop the column `volume` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `slot` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solAmount` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenAmount` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "volume",
ADD COLUMN     "slot" INTEGER NOT NULL,
ADD COLUMN     "solAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tokenAmount" DOUBLE PRECISION NOT NULL;
