-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "mintAddress" TEXT NOT NULL,
    "poolAddress" TEXT NOT NULL,
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

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "asset" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "usdPrice" DOUBLE PRECISION NOT NULL,
    "usdVolume" DOUBLE PRECISION NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isMev" BOOLEAN NOT NULL,
    "isValidPrice" BOOLEAN NOT NULL,
    "isValidPosition" BOOLEAN NOT NULL,
    "poolId" TEXT NOT NULL,
    "nativeVolume" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tokenId" INTEGER NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kline" (
    "id" SERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "netVolume" DOUBLE PRECISION NOT NULL,
    "tokenId" INTEGER NOT NULL,

    CONSTRAINT "kline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holder" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "solBalance" TEXT NOT NULL,
    "solBalanceDisplay" DOUBLE PRECISION NOT NULL,
    "tags" JSONB,
    "tokenId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_mintAddress_key" ON "Token"("mintAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Token_poolAddress_key" ON "Token"("poolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_txHash_key" ON "Trade"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "kline_tokenId_time_key" ON "kline"("tokenId", "time");

-- CreateIndex
CREATE UNIQUE INDEX "Holder_tokenId_address_key" ON "Holder"("tokenId", "address");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kline" ADD CONSTRAINT "kline_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holder" ADD CONSTRAINT "Holder_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
