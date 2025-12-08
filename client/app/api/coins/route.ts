import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // console.log(process.env.DATABASE_URL);
    const tokens = await prisma.token.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
