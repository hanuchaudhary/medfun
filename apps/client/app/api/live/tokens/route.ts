import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const liveTokens = await prisma.token.findMany({
      where: {
        isStreamLive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ tokens: liveTokens });
  } catch (error) {
    console.error("Error fetching live tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch live tokens" },
      { status: 500 }
    );
  }
}
