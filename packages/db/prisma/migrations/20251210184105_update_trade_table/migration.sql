/*
  Warnings:

  - You are about to drop the column `tokenId` on the `Holder` table. All the data in the column will be lost.
  - The primary key for the `Token` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `tokenId` on the `Trade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenMintAddress,address]` on the table `Holder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenMintAddress` to the `Holder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenMintAddress` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Holder" DROP CONSTRAINT "Holder_tokenId_fkey";

-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_tokenId_fkey";

-- DropIndex
DROP INDEX "Holder_tokenId_address_key";

-- AlterTable
ALTER TABLE "Holder" DROP COLUMN "tokenId",
ADD COLUMN     "tokenMintAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Token" DROP CONSTRAINT "Token_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("mintAddress");

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "tokenId",
ADD COLUMN     "tokenMintAddress" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Holder_tokenMintAddress_address_key" ON "Holder"("tokenMintAddress", "address");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "Token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holder" ADD CONSTRAINT "Holder_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "Token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
