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
    const limit = parseInt(searchParams.get("limit") || "100");
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

    const response = await axios.get(
      `https://datapi.jup.ag/v1/txs/${mint}?limit=${limit}&offset=${offset}`
    );

    console.log(response.data);

    const txData = response.data.txns;

    if (txData && Array.isArray(txData)) {
      await prisma.$transaction(
        txData.map((tx: any) =>
          prisma.trade.upsert({
            where: {
              txHash: tx.tx_hash,
            },
            update: {
              asset: tx.asset,
              type: tx.type,
              usdPrice: tx.usd_price,
              usdVolume: tx.usd_volume,
              traderAddress: tx.trader_address,
              amount: tx.amount,
              isMev: tx.is_mev,
              isValidPrice: tx.is_valid_price,
              isValidPosition: tx.is_valid_position,
              poolId: tx.pool_id,
              nativeVolume: tx.native_volume,
              timestamp: new Date(tx.timestamp * 1000),
            },
            create: {
              tokenId: token.id,
              asset: tx.asset,
              type: tx.type,
              usdPrice: tx.usd_price,
              usdVolume: tx.usd_volume,
              traderAddress: tx.trader_address,
              txHash: tx.tx_hash,
              amount: tx.amount,
              isMev: tx.is_mev,
              isValidPrice: tx.is_valid_price,
              isValidPosition: tx.is_valid_position,
              poolId: tx.pool_id,
              nativeVolume: tx.native_volume,
              timestamp: new Date(tx.timestamp * 1000),
            },
          })
        )
      );
    }

    const trades = await prisma.trade.findMany({
      where: { tokenId: token.id },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    });

    const totalTrades = await prisma.trade.count({
      where: { tokenId: token.id },
    });

    return NextResponse.json({
      success: true,
      trades,
      pagination: {
        limit,
        offset,
        total: totalTrades,
      },
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
