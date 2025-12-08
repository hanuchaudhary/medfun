import { NextRequest, NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import z from "zod";

interface TokenRequestBody {
  channelName: string;
  uid: number;
  role: number;
}

const TokenRequestBodySchema = z.object({
  channelName: z.string().min(1).max(100),
  uid: z.number().positive(),
  role: z.number().min(0).max(1),
});

export async function POST(request: NextRequest) {
  try {
    const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_CERTIFICATE;
    
    const { success, data } = TokenRequestBodySchema.safeParse(
        await request.json()
    );

    console.log({
      data,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { channelName, uid, role } = data;

    if (!APP_ID || !APP_CERTIFICATE) {
      return NextResponse.json(
        { error: "Agora App ID or Certificate is not set" },
        { status: 500 }
      );
    }

    const tokenExpireTime = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + tokenExpireTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role === 1 ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      tokenExpireTime,
      privilegeExpiredTs
    );

    return NextResponse.json({ token: token }, { status: 200 });
  } catch (error) {
    console.log("error: ", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
