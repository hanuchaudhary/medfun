"use server";

import { prisma } from "./prisma";
import axios from "axios";

export async function updateTokenWithJupiterData(mintAddress: string) {
  try {
    const res = await axios.get(
      `https://lite-api.jup.ag/tokens/v2/search?query=${mintAddress}`
    );

    // console.log(res.data);

    let token;
    if (res.data.length) {
      const jupData = res.data[0];
      const volume24h = jupData.stats24h
        ? (jupData.stats24h.buyVolume || 0) + (jupData.stats24h.sellVolume || 0)
        : null;

      token = await prisma.token.update({
        where: { mintAddress },
        data: {
          bondingCurveProgress: jupData.bondingCurve
            ? jupData.bondingCurve
            : jupData.graduatedPool
              ? 100
              : 0,
          volume: volume24h,
          graduatedPoolAddress: jupData.graduatedPool || null,
          // graduatedAt: jupData.graduatedAt || null,
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
        where: { mintAddress },
      });
    }

    return { success: true, token };
  } catch (error) {
    console.error("Error updating token with Jupiter data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
