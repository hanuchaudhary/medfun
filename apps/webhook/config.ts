import { TRADE_QUEUE_NAME } from "@repo/config";
import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL;

export const tradeQueue = new Queue(TRADE_QUEUE_NAME, {
  connection: {
    url: REDIS_URL,
    maxRetriesPerRequest: null,
  },
});
