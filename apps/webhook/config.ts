import { TRADE_QUEUE_NAME } from "@repo/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL!;

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("Webhook Redis connected");
});

connection.on("ready", () => {
  console.log("Webhook Redis ready");
});

connection.on("error", (err) => {
  console.error("Webhook Redis error:", err);
});

connection.on("close", () => {
  console.warn("Webhook Redis connection closed");
});

connection.on("reconnecting", () => {
  console.log("Webhook Redis reconnecting...");
});

export const tradeQueue = new Queue(TRADE_QUEUE_NAME, {
  connection,
});

export const redisConnection = connection;

const DEDUP_TTL = 300;

export async function isSignatureProcessed(
  signature: string
): Promise<boolean> {
  const key = `dedup:${signature}`;
  const exists = await connection.exists(key);
  return exists === 1;
}

export async function markSignatureProcessed(signature: string): Promise<void> {
  const key = `dedup:${signature}`;
  await connection.setex(key, DEDUP_TTL, "1");
}
