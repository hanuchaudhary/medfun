import axios from "axios";
import { Token } from "@/types/token";
import { prisma } from "@repo/db";

export const saveToken = async (token: Token) => {
  try {
    const sToken = await prisma.token.create({
      data: {
        name: token.name as string,
        symbol: token.symbol as string,
        description: token.description as string,
        mintAddress: token.mintAddress as string,
        poolAddress: token.poolAddress as string,
        website: token.website as string,
        twitter: token.twitter as string,
        telegram: token.telegram as string,
        imageUrl: token.imageUrl as string,
        metadataUrl: token.metadataUrl as string,
        creatorAddress: token.creatorAddress as string,
        bondingCurveProgress: token.bondingCurveProgress as number,
        volume: token.volume as number,
        liquidity: token.liquidity as number,
        marketCap: token.marketCap as number,
      },
    });
    console.log("Token saved to database:", sToken);
    return sToken;
  } catch (error) {
    console.error("Error saving token to database:", error);
    throw error;
  }
};

export const getTokenDetails = async (mintAddress: string) => {
  try {
    const res = await axios.get(
      `https://lite-api.jup.ag/tokens/v2/search?query=${mintAddress}`
    );

    if (res.data.length) {
      await prisma.token.update({
        where: { mintAddress: mintAddress },
        data: {
          name: res.data[0].name,
          symbol: res.data[0].symbol,
          description: res.data[0].description,
          imageUrl: res.data[0].icon,
          metadataUrl: res.data[0].metadataUrl,
          bondingCurveProgress: res.data[0].bondingCurve,
          volume: res.data[0].volume,
          liquidity: res.data[0].liquidity,
          marketCap: res.data[0].mcap,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching token details:", error);
  }
};

