import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function serializeKlines(klines: unknown[]) {
  return klines.map((kline: any) => ({
    ...kline,
    trades: kline.trades ? Number(kline.trades) : 0,
  }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("tf") ?? "1m";
    const { mint } = await params;
    let klines;
    switch (timeframe) {
      case "1m":
        klines = await prisma.$queryRaw`
        SELECT
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          trades
        FROM kline
        WHERE token_mint_address = ${mint}
        ORDER BY timestamp ASC
        LIMIT 1000;
      `;
        return NextResponse.json({
          klines: serializeKlines(klines as unknown[]),
        });
      case "5m":
        klines = await prisma.$queryRaw`
        SELECT
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          trades
        FROM klines_5m
        WHERE token_mint_address = ${mint}
        ORDER BY timestamp ASC
        LIMIT 1000;
      `;
        return NextResponse.json({
          klines: serializeKlines(klines as unknown[]),
        });
      case "24h":
        klines = await prisma.$queryRaw`
        SELECT
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          trades
        FROM klines_24h
        WHERE token_mint_address = ${mint}
        ORDER BY timestamp ASC
        LIMIT 1000;
      `;
        return NextResponse.json({
          klines: serializeKlines(klines as unknown[]),
        });
      case "1w":
        klines = await prisma.$queryRaw`
        SELECT
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          trades
        FROM klines_1w
        WHERE token_mint_address = ${mint}
        ORDER BY timestamp ASC
        LIMIT 1000;
      `;
        return NextResponse.json({
          klines: serializeKlines(klines as unknown[]),
        });
      default:
        return NextResponse.json(
          { error: "Invalid timeframe" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching klines:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
