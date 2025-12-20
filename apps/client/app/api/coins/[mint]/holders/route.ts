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

    if (!mint) {
      return NextResponse.json(
        { success: false, error: "Token mint address is required" },
        { status: 400 }
      );
    }

    const cacheKey = `holders:${mint}`;
    const cached = await redisCache.get(cacheKey);

    if (cached) {
      return NextResponse.json({ success: true, holders: cached });
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

    const holders = await prisma.holder.findMany({
      where: { tokenMintAddress: mint },
      orderBy: { amount: "desc" },
    });

    await redisCache.set(cacheKey, holders, CACHE_TTL);

    return NextResponse.json({
      success: true,
      holders,
    });
  } catch (error) {
    console.error("Error fetching holders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
