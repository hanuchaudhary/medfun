import { Elysia } from "elysia";
import { parseMeteoraWebhook, type WebhookTransaction } from "./parser";
import {
  tradeQueue,
  isSignatureProcessed,
  markSignatureProcessed,
} from "./config";

const PORT = process.env.PORT || 8000;

const app = new Elysia()
  .get("/", () => ({
    status: "Webhook server is running",
  }))
  .post("/webhook", async ({ body, set }) => {
    try {
      const payload = body as WebhookTransaction[];

      if (!payload?.length) {
        set.status = 400;
        return { error: "Invalid payload" };
      }

      const parsedTrades = parseMeteoraWebhook(payload);

      if (!parsedTrades.length) {
        return { success: true };
      }

      const newTrades = [];
      for (const trade of parsedTrades) {
        const isDuplicate = await isSignatureProcessed(trade.signature);
        if (!isDuplicate) {
          await markSignatureProcessed(trade.signature);
          newTrades.push(trade);
        } else {
          console.log(`Skipping duplicate trade: ${trade.signature}`);
        }
      }

      if (!newTrades.length) {
        return { success: true, message: "All trades were duplicates" };
      }

      console.log("PARSED TRADES:", newTrades);

      const result = await tradeQueue.addBulk(
        newTrades.map((trade) => ({
          name: "PROCESS_TRADE",
          data: trade,
          opts: {
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
          },
        }))
      );

      console.log(`Enqueued ${result.length} trades for processing.`);

      return { success: true };
    } catch (e) {
      console.error("Webhook error:", e);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })
  .listen(PORT);

console.log(`🦊 Webhook server is running on port ${PORT}`);
