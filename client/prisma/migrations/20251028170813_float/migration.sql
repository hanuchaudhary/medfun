/*
  Warnings:

  - The `bondingCurveProgress` column on the `Token` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Token" DROP COLUMN "bondingCurveProgress",
ADD COLUMN     "bondingCurveProgress" DOUBLE PRECISION;
