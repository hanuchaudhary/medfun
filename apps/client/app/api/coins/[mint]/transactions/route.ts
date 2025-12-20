import { prisma } from "@/lib/prisma";
import { redisCache } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL = 120;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint } = await params;
    const { searchParams } = new URL(req.nextUrl);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!mint) {
      return NextResponse.json(
        { success: false, error: "Token mint address is required" },
        { status: 400 }
      );
    }

    const cacheKey = `transactions:${mint}:${limit}:${offset}`;
    const cached = await redisCache.get(cacheKey);

    if (cached) {
      return NextResponse.json({ success: true, transactions: cached });
    }

    const token = await prisma.token.findUnique({
      where: { mintAddress: mint },
    });

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    const transactions = await prisma.trade.findMany({
      where: { tokenMintAddress: mint },
      orderBy: { timestamp: "desc" },
      skip: offset,
      take: limit,
    });

    const formattedTransactions = transactions.map((trade) => ({
      ...trade,
      price: Number(trade.price),
      tokenAmount: Number(trade.tokenAmount),
      solAmount: Number(trade.solAmount),
    }));

    await redisCache.set(cacheKey, formattedTransactions, CACHE_TTL);

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
