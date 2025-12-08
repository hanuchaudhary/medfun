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
        { success: false, error: "Token ID is required" },
        { status: 400 }
      );
    }

    const res = await axios.get(
      `https://lite-api.jup.ag/tokens/v2/search?query=${mint}`
    );

    // console.log(res.data);
    

    let token;
    if (res.data.length) {
      const jupData = res.data[0];
      const volume24h = jupData.stats24h 
        ? (jupData.stats24h.buyVolume || 0) + (jupData.stats24h.sellVolume || 0)
        : null;

      token = await prisma.token.update({
        where: { mintAddress: mint },
        data: {
          bondingCurveProgress: jupData.bondingCurve || null,
          volume: volume24h,
          liquidity: jupData.liquidity || null,
          marketCap: jupData.mcap || null,
          holderCount: jupData.holderCount || 0,
          stats5m: jupData.stats5m || null,
          stats1h: jupData.stats1h || null,
          stats6h: jupData.stats6h || null,
          stats24h: jupData.stats24h || null,
        },
      });
    } else {
      token = await prisma.token.findUnique({
        where: { mintAddress: mint },
      });
    }

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Error fetching token:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await req.json();
    const { description, twitter, telegram, website } = body;
    if (!description && !twitter && !telegram && !website) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }
    let token;

    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (telegram !== undefined) updateData.telegram = telegram;
    if (website !== undefined) updateData.website = website;

    token = await prisma.token.update({
      where: {
        mintAddress: mint,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      token,
      message: "Token updated successfully",
    });
  } catch (error) {
    console.error("Error updating token:", error);
    if ((error as any).code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
