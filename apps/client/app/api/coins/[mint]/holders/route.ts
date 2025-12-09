import { prisma } from "@/lib/prisma";
import axios from "axios";
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
      `https://datapi.jup.ag/v1/holders/${mint}`
    );

    const holdersData = response.data;

    if (holdersData?.data?.holders && Array.isArray(holdersData.data.holders)) {
      await prisma.$transaction(
        holdersData.data.holders.map((holder: any) =>
          prisma.holder.upsert({
            where: {
              tokenId_address: {
                tokenId: token.id,
                address: holder.address,
              },
            },
            update: {
              amount: holder.amount,
              solBalance: holder.sol_balance,
              solBalanceDisplay: holder.sol_balance_display,
              tags: holder.tags || null,
            },
            create: {
              tokenId: token.id,
              address: holder.address,
              amount: holder.amount,
              solBalance: holder.sol_balance,
              solBalanceDisplay: holder.sol_balance_display,
              tags: holder.tags || null,
            },
          })
        )
      );
    }

    const holders = await prisma.holder.findMany({
      where: { tokenId: token.id },
      orderBy: { amount: "desc" },
    });

    return NextResponse.json({
      success: true,
      holders,
      totalHolders: holders.length,
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
