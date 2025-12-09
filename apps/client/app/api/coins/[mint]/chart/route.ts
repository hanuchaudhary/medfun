import { prisma } from "@/lib/prisma";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    ``;
    const { mint } = await params;
    const { searchParams } = new URL(req.url);
    const interval = searchParams.get("interval") || "1_DAY";

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
      `https://datapi.jup.ag/v1/charts/net-volume/${mint}?interval=${interval}`
    );

    const chartData = response.data;

    if (chartData?.data?.klines && Array.isArray(chartData.data.klines)) {
      await prisma.$transaction(
        chartData.data.klines.map((kline: any) =>
          prisma.kline.upsert({
            where: {
              tokenId_time: {
                tokenId: token.id,
                time: new Date(kline.time * 1000),
              },
            },
            update: {
              netVolume: kline.net_volume,
            },
            create: {
              tokenId: token.id,
              time: new Date(kline.time * 1000),
              netVolume: kline.net_volume,
            },
          })
        )
      );
    }

    const klines = await prisma.kline.findMany({
      where: { tokenId: token.id },
      orderBy: { time: "asc" },
    });

    return NextResponse.json({
      success: true,
      klines,
      interval,
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
