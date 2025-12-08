-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "holderCount" INTEGER,
ADD COLUMN     "stats1h" JSONB,
ADD COLUMN     "stats24h" JSONB,
ADD COLUMN     "stats5m" JSONB,
ADD COLUMN     "stats6h" JSONB;
