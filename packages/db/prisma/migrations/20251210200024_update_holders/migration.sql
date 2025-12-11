/*
  Warnings:

  - You are about to drop the column `address` on the `Holder` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Holder` table. All the data in the column will be lost.
  - You are about to drop the column `solBalance` on the `Holder` table. All the data in the column will be lost.
  - You are about to drop the column `solBalanceDisplay` on the `Holder` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Holder` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Holder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenMintAddress,holderAddress]` on the table `Holder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `holderAddress` to the `Holder` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Holder_tokenMintAddress_address_key";

-- AlterTable
ALTER TABLE "Holder" DROP COLUMN "address",
DROP COLUMN "createdAt",
DROP COLUMN "solBalance",
DROP COLUMN "solBalanceDisplay",
DROP COLUMN "tags",
DROP COLUMN "updatedAt",
ADD COLUMN     "holderAddress" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Holder_tokenMintAddress_holderAddress_key" ON "Holder"("tokenMintAddress", "holderAddress");
