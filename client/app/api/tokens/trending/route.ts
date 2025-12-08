import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 3;

    const tokens = await prisma.token.findMany({
      where: {
        bondingCurveProgress: {
          not: null,
        },
      },
      orderBy: [
        // { volume: "desc" },
        // { marketCap: "desc" },
        { bondingCurveProgress: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
