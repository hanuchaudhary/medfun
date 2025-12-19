import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get("tf") ?? "1m";
  const { mint } = await params;

  const bucketMap: Record<string, string> = {
    "1m": "1 minute",
    "5m": "5 minutes",
    "15m": "15 minutes",
    "1h": "1 hour",
  };

  const bucket = bucketMap[timeframe];
  if (!bucket) {
    return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
  }
  if (timeframe === "1m") {
    const klines = await prisma.$queryRaw`
      SELECT
        timestamp,
        open,
        high,
        low,
        close,
        volume,
        trades
      FROM kline
      WHERE "token_mint_address" = ${mint}
      ORDER BY timestamp ASC
      LIMIT 1000;
    `;

    return NextResponse.json({ klines });
  }

  const klines = await prisma.$queryRaw`
    SELECT
      time_bucket(${bucket}, timestamp) AS timestamp,
      FIRST(open, timestamp) AS open,
      MAX(high) AS high,
      MIN(low) AS low,
      LAST(close, timestamp) AS close,
      SUM(volume) AS volume,
      SUM(trades) AS trades
    FROM kline
    WHERE "token_mint_address" = ${mint}
    GROUP BY 1
    ORDER BY 1 ASC
    LIMIT 1000;
  `;

  return NextResponse.json({ klines });
}
