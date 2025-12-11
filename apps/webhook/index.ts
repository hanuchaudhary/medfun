import express, { type Request, type Response } from "express";
import {
  get1mBucket,
  parseMeteoraWebhook,
  type WebhookTransaction,
} from "./parser";
import { prisma } from "@repo/db";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body as WebhookTransaction[];
    console.log("WEBHOOK RECIEVED", payload?.length);
    if (!payload?.length)
      return res.status(400).json({ error: "Invalid payload" });

    const allowed = [
      "TRANSFER",
      "SWAP",
      "PROGRAM_INVOKE",
      "UNKNOWN",
      "BUY",
      "SELL",
    ];
    const type = payload[0]?.type!;

    if (!allowed.includes(type)) {
      return res.status(200).send("Ignored");
    }

    const parsedTrades = parseMeteoraWebhook(payload);
    if (!parsedTrades.length) return res.status(200).send("No trades");

    for (const trade of parsedTrades) {
      try {
        const exists = await prisma.trade.findFirst({
          where: { signature: trade.signature },
        });

        if (exists) {
          console.log("Duplicate webhook ignored:", trade.signature);
          continue;
        }

        await prisma.trade.create({
          data: {
            type: trade.type,
            signature: trade.signature,
            traderAddress: trade.traderAddress,
            tokenMintAddress: trade.tokenMint,
            price: trade.price,
            tokenAmount: trade.tokenAmount,
            solAmount: trade.solAmount,
            slot: trade.slot,
            timestamp: new Date(trade.timestamp * 1000),
          },
        });

        await prisma.holder.upsert({
          where: {
            tokenMintAddress_holderAddress: {
              tokenMintAddress: trade.tokenMint,
              holderAddress: trade.traderAddress,
            },
          },
          update: {
            amount:
              trade.type === "BUY"
                ? { increment: trade.tokenAmount }
                : { decrement: trade.tokenAmount },
          },
          create: {
            holderAddress: trade.traderAddress,
            amount: trade.tokenAmount,
            tokenMintAddress: trade.tokenMint,
          },
        });

        const bucket = get1mBucket(trade.timestamp);
        const existingKline = await prisma.kline.findUnique({
          where: {
            tokenMintAddress_timestamp: {
              tokenMintAddress: trade.tokenMint,
              timestamp: bucket,
            },
          },
        });

        if (!existingKline) {
          await prisma.kline.create({
            data: {
              tokenMintAddress: trade.tokenMint,
              timestamp: bucket,
              open: trade.price,
              high: trade.price,
              low: trade.price,
              close: trade.price,
              volume: trade.tokenAmount,
              trades: 1,
            },
          });
        } else {
          await prisma.kline.update({
            where: {
              tokenMintAddress_timestamp: {
                tokenMintAddress: trade.tokenMint,
                timestamp: bucket,
              },
            },
            data: {
              high:
                trade.price > existingKline.high
                  ? trade.price
                  : existingKline.high,
              low:
                trade.price < existingKline.low
                  ? trade.price
                  : existingKline.low,
              close: trade.price,
              volume: existingKline.volume + trade.tokenAmount,
              trades: existingKline.trades + 1,
            },
          });
        }
      } catch (tradeError) {
        console.error("Error processing trade:", trade.signature, tradeError);
      }
    }

    res.status(200).send("OK");
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", async (req: Request, res: Response) => {
  try {
    const tradeCount = await prisma.trade.count();
    res.json({ status: "Webhook server is running", trades: tradeCount });
  } catch (error) {
    console.error("Error fetching trade count:", error);
    res.json({ status: "Webhook server is running" });
  }
});

app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});
