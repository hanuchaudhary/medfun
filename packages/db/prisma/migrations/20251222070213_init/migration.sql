-- CreateTable
CREATE TABLE "token" (
    "mint_address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "pool_address" TEXT NOT NULL,
    "graduated_pool_address" TEXT,
    "website" TEXT,
    "is_stream_live" BOOLEAN NOT NULL DEFAULT false,
    "twitter" TEXT,
    "telegram" TEXT,
    "image_url" TEXT,
    "metadata_url" TEXT,
    "creator_address" TEXT NOT NULL,
    "bonding_curve_progress" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "liquidity" DOUBLE PRECISION,
    "market_cap" DOUBLE PRECISION,
    "holder_count" INTEGER,
    "stats_5m" JSONB,
    "stats_1h" JSONB,
    "stats_6h" JSONB,
    "stats_24h" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_pkey" PRIMARY KEY ("mint_address")
);

-- CreateTable
CREATE TABLE "trade" (
    "signature" TEXT NOT NULL,
    "token_mint_address" TEXT NOT NULL,
    "instruction_index" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "token_amount" DECIMAL(38,18) NOT NULL,
    "sol_amount" DECIMAL(38,18) NOT NULL,
    "trader_address" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "trade_pkey" PRIMARY KEY ("signature","token_mint_address","timestamp")
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
    "token_mint_address" TEXT NOT NULL,

    CONSTRAINT "kline_pkey" PRIMARY KEY ("token_mint_address","timestamp")
);

-- CreateTable
CREATE TABLE "holder" (
    "id" SERIAL NOT NULL,
    "holder_address" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "token_mint_address" TEXT NOT NULL,

    CONSTRAINT "holder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_pool_address_key" ON "token"("pool_address");

-- CreateIndex
CREATE UNIQUE INDEX "token_graduated_pool_address_key" ON "token"("graduated_pool_address");

-- CreateIndex
CREATE INDEX "trade_token_mint_address_timestamp_idx" ON "trade"("token_mint_address", "timestamp");

-- CreateIndex
CREATE INDEX "kline_token_mint_address_timestamp_idx" ON "kline"("token_mint_address", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "holder_token_mint_address_idx" ON "holder"("token_mint_address");

-- CreateIndex
CREATE UNIQUE INDEX "holder_token_mint_address_holder_address_key" ON "holder"("token_mint_address", "holder_address");

-- AddForeignKey
ALTER TABLE "trade" ADD CONSTRAINT "trade_token_mint_address_fkey" FOREIGN KEY ("token_mint_address") REFERENCES "token"("mint_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kline" ADD CONSTRAINT "kline_token_mint_address_fkey" FOREIGN KEY ("token_mint_address") REFERENCES "token"("mint_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holder" ADD CONSTRAINT "holder_token_mint_address_fkey" FOREIGN KEY ("token_mint_address") REFERENCES "token"("mint_address") ON DELETE RESTRICT ON UPDATE CASCADE;
