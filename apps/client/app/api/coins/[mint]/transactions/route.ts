import { prisma } from "@/lib/prisma";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!mint) {
      return NextResponse.json(
        { success: false, error: "Token mint address is required" },
        { status: 400 }
      );
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
