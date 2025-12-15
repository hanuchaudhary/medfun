-- CreateTable
CREATE TABLE "token" (
    "mintAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "poolAddress" TEXT NOT NULL,
    "graduatedPoolAddress" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "imageUrl" TEXT,
    "metadataUrl" TEXT,
    "creatorAddress" TEXT NOT NULL,
    "isStreamLive" BOOLEAN NOT NULL DEFAULT false,
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

    CONSTRAINT "token_pkey" PRIMARY KEY ("mintAddress")
);

-- CreateTable
CREATE TABLE "trade" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "tokenAmount" DOUBLE PRECISION NOT NULL,
    "solAmount" DOUBLE PRECISION NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "slot" INTEGER NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,

    CONSTRAINT "trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kline" (
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(38,18) NOT NULL,
    "high" DECIMAL(38,18) NOT NULL,
    "low" DECIMAL(38,18) NOT NULL,
    "close" DECIMAL(38,18) NOT NULL,
    "volume" DECIMAL(38,18) NOT NULL,
    "trades" INTEGER NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,

    CONSTRAINT "kline_pkey" PRIMARY KEY ("tokenMintAddress","timestamp")
);

-- CreateTable
CREATE TABLE "holder" (
    "id" SERIAL NOT NULL,
    "holderAddress" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tokenMintAddress" TEXT NOT NULL,

    CONSTRAINT "holder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_mintAddress_key" ON "token"("mintAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_poolAddress_key" ON "token"("poolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "token_graduatedPoolAddress_key" ON "token"("graduatedPoolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "holder_tokenMintAddress_holderAddress_key" ON "holder"("tokenMintAddress", "holderAddress");

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kline" ADD CONSTRAINT "kline_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holder" ADD CONSTRAINT "holder_tokenMintAddress_fkey" FOREIGN KEY ("tokenMintAddress") REFERENCES "token"("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
