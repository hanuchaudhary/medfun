import { Worker } from "bullmq";
import { connection, publisher } from "./config.js";
import { TRADE_QUEUE_NAME } from "@repo/config";
import { prisma } from "@repo/db";

const tradeWorker = new Worker(
  TRADE_QUEUE_NAME,
  async (job) => {
    const trade = job.data;

    const tradeTs = new Date(trade.timestamp * 1000);
    const bucket = new Date(Math.floor(tradeTs.getTime() / 60000) * 60000);

    const delta = trade.type === "BUY" ? trade.tokenAmount : -trade.tokenAmount;

    await prisma.$transaction(async (tx) => {
      await tx.trade.createMany({
        data: [
          {
            type: trade.type,
            price: trade.price,
            signature: trade.signature,
            traderAddress: trade.traderAddress,
            solAmount: trade.solAmount,
            slot: trade.slot,
            timestamp: tradeTs,
            tokenAmount: trade.tokenAmount,
            instructionIndex: trade.instructionIndex ?? null,
            tokenMintAddress: trade.tokenMint,
          },
        ],
        skipDuplicates: true,
      });

      await tx.$executeRaw`
        INSERT INTO kline (
          token_mint_address,
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          trades
        )
        VALUES (
          ${trade.tokenMint},
          ${bucket},
          ${trade.price},
          ${trade.price},
          ${trade.price},
          ${trade.price},
          ${trade.tokenAmount},
          1
        )
        ON CONFLICT (token_mint_address, timestamp)
        DO UPDATE SET
          high   = GREATEST(kline.high, EXCLUDED.high),
          low    = LEAST(kline.low, EXCLUDED.low),
          close  = EXCLUDED.close,
          volume = kline.volume + EXCLUDED.volume,
          trades = kline.trades + EXCLUDED.trades;
      `;

      await tx.$executeRaw`
        INSERT INTO holder (
          token_mint_address,
          holder_address,
          amount
        )
        VALUES (
          ${trade.tokenMint},
          ${trade.traderAddress},
          ${delta}
        )
        ON CONFLICT (token_mint_address, holder_address)
        DO UPDATE SET
          amount = holder.amount + EXCLUDED.amount;
      `;

      await tx.$executeRaw`
        DELETE FROM holder
        WHERE token_mint_address = ${trade.tokenMint}
          AND amount <= 0;
      `;
    });

    const tradeEvent = {
      type: trade.type,
      tokenMint: trade.tokenMint,
      price: trade.price,
      solAmount: trade.solAmount,
      tokenAmount: trade.tokenAmount,
      traderAddress: trade.traderAddress,
      signature: trade.signature,
      timestamp: trade.timestamp,
    };

    await publisher.publish(
      `trade:${trade.tokenMint}`,
      JSON.stringify(tradeEvent)
    );
  },
  { connection, concurrency: 5 }
);

tradeWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

tradeWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

tradeWorker.on("error", (err) => {
  console.error("Worker error:", err);
});

tradeWorker.on("active", (job) => {
  console.log(`Job ${job.id} is now active`);
});

tradeWorker.on("stalled", (jobId) => {
  console.warn(`Job ${jobId} has stalled`);
});

tradeWorker.on("progress", (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}`);
});

connection.on("connect", () => {
  console.log("Redis connected");
});

connection.on("ready", () => {
  console.log("Redis ready");
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

connection.on("close", () => {
  console.warn("Redis connection closed");
});

connection.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

console.log("🦊 Worker is running and listening for jobs...");
