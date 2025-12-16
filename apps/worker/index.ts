import { Worker } from "bullmq";
import { connection, get1mBucket, publisher } from "./config.js";
import { TRADE_QUEUE_NAME } from "@repo/config";
import { prisma } from "@repo/db";

const tradeWorker = new Worker(
  TRADE_QUEUE_NAME,
  async (job) => {
    const trade = job.data;
    console.log("GOT TRADE: ",trade);
    
    try {
      await prisma.trade.create({
        data: {
          type: trade.type,
          price: trade.price,
          signature: trade.signature,
          traderAddress: trade.traderAddress,
          solAmount: trade.solAmount,
          slot: trade.slot,
          timestamp: new Date(trade.timestamp * 1000),
          tokenAmount: trade.tokenAmount,
          tokenMintAddress: trade.tokenMint,
        },
      });
    } catch (error) {
      console.error("Error inserting trade:", error);
      return;
    }

    const bucket = get1mBucket(trade.timestamp);
    await prisma.$executeRaw`
      INSERT INTO "kline" (
        "tokenMintAddress",
        "timestamp",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "trades"
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
      ON CONFLICT ("tokenMintAddress","timestamp")
      DO UPDATE SET
        high = GREATEST("kline".high, EXCLUDED.high),
        low = LEAST("kline".low, EXCLUDED.low),
        close = EXCLUDED.close,
        volume = "kline".volume + EXCLUDED.volume,
        trades = "kline".trades + 1;
    `;

    console.log(`Processing job ${job.id} with data:`, job.data);
    await publisher.publish(
      "TRADE_EVENT",
      JSON.stringify({
        type: "TRADE",
        data: trade,
      })
    );
  },
  { connection, concurrency: 5 }
);

tradeWorker.on("completed", (job) => {
  console.log(`Job ${job.id} has been completed`);
});

tradeWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} has failed with error:`, err);
});

console.log("🦊 Worker is running and listening for jobs...");
