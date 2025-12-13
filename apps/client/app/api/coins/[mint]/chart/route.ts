import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

    const klines = await prisma.kline.findMany({
      where: { tokenMintAddress: mint },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json({
      success: true,
      klines,
      count: klines.length,
    });
  } catch (error) {
    console.error("Error syncing klines:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
