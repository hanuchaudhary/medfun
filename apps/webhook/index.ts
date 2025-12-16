import { Elysia } from "elysia";
import { parseMeteoraWebhook, type WebhookTransaction } from "./parser";
import { tradeQueue } from "./config";

const PORT = process.env.PORT || 8000;

const app = new Elysia()
  .get("/", () => ({
    status: "Webhook server is running",
  }))
  .post("/webhook", async ({ body, set }) => {
    try {
      const payload = body as WebhookTransaction[];

      console.log("WEBHOOK HITTED!");

      if (!payload?.length) {
        set.status = 400;
        return { error: "Invalid payload" };
      }

      const parsedTrades = parseMeteoraWebhook(payload);
      console.log("PARSED TRADES: ",parsedTrades);
      
      if (!parsedTrades.length) {
        return { success: true };
      }

      await tradeQueue.addBulk(
        parsedTrades.map((trade) => ({
          name: "PROCESS_TRADE",
          data: trade,
          opts: {
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
          },
        }))
      );

      return { success: true };
    } catch (e) {
      console.error("Webhook error:", e);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })
  .listen(PORT);

console.log(`🦊 Webhook server is running on port ${PORT}`);
