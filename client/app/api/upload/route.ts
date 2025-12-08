import { NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  DynamicBondingCurveClient,
  deriveDbcPoolAddress,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getVanityPair } from "@/lib/db";
import bs58 from "bs58";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
const POOL_CONFIG_KEY = process.env.POOL_CONFIG_KEY;
const QUOTE_MINT =
  process.env.QUOTE_MINT || "So11111111111111111111111111111111111111112";

const DO_SPACES_ACCESS_KEY_ID = process.env.DO_SPACES_ACCESS_KEY_ID as string;
const DO_SPACES_SECRET_ACCESS_KEY = process.env
  .DO_SPACES_SECRET_ACCESS_KEY as string;
const DO_SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT as string;
const DO_SPACES_BUCKET = process.env.DO_SPACES_BUCKET as string;
const DO_SPACES_PUBLIC_URL = process.env.DO_SPACES_PUBLIC_URL as string;

const s3Client = new S3Client({
  endpoint: DO_SPACES_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: DO_SPACES_ACCESS_KEY_ID,
    secretAccessKey: DO_SPACES_SECRET_ACCESS_KEY,
  },
});

export async function POST(req: Request) {
  try {
    const {
      tokenName,
      tokenTicker,
      tokenDescription,
      tokenImage,
      initialMarketCap = 5000,
      migrationMarketCap = 75000,
      userWallet,
      twitter,
      website,
      telegram,
    } = await req.json();

    if (!tokenName || !tokenTicker || !userWallet) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: tokenName, tokenTicker, userWallet",
        },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const userPublicKey = new PublicKey(userWallet);

    let metadataUrl = "";
    let imageUrl = "";

    const timestamp = Date.now();
    const sanitizedTokenName = tokenName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const dynamicName = `${timestamp}-${sanitizedTokenName}`;

    if (tokenImage) {
      const uploadedImageUrl = await uploadTokenImage(tokenImage, dynamicName);
      if (!uploadedImageUrl) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload token image",
          },
          { status: 400 }
        );
      }
      imageUrl = uploadedImageUrl;
    }

    if (tokenName || tokenTicker || tokenDescription || imageUrl) {
      const uploadedMetadataUrl = await uploadTokenMetadata({
        tokenName,
        tokenTicker,
        tokenDescription,
        imageUrl,
        mint: dynamicName,
        twitter,
        website,
        telegram,
      });
      if (!uploadedMetadataUrl) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload token metadata",
          },
          { status: 400 }
        );
      }
      metadataUrl = uploadedMetadataUrl;
    }

    const dbcClient = new DynamicBondingCurveClient(connection, "confirmed");

    // Vanity keypair generation code disabled for now

    const vanityKeypair = await getVanityPair();
    if (!vanityKeypair) {
      return NextResponse.json(
        {
          success: false,
          error: "No available vanity keypairs. Please try again later.",
        },
        { status: 500 }
      );
    }

    const secretKey = bs58.decode(vanityKeypair.secret_key_base58);
    const generatedKeypair = Keypair.fromSecretKey(secretKey);
    const mintPublicKey = generatedKeypair.publicKey;
    // console.log("Using vanity mint address:", mintPublicKey.toString());

    // const generatedKeypair = Keypair.generate();
    // const mintPublicKey = generatedKeypair.publicKey;
    // console.log("Using generated mint address:", mintPublicKey.toString());

    const poolTx = await dbcClient.pool.createPool({
      config: new PublicKey(POOL_CONFIG_KEY as string),
      baseMint: mintPublicKey,
      name: tokenName,
      symbol: tokenTicker,
      uri: metadataUrl || "",
      payer: userPublicKey,
      poolCreator: userPublicKey,
    });

    const { blockhash } = await connection.getLatestBlockhash();
    poolTx.feePayer = userPublicKey;
    poolTx.recentBlockhash = blockhash;

    poolTx.sign(generatedKeypair);
    const tokenMint = mintPublicKey.toString();

    const poolAddress = deriveDbcPoolAddress(
      mintPublicKey,
      new PublicKey(QUOTE_MINT),
      new PublicKey(POOL_CONFIG_KEY as string)
    ).toString();

    console.log("Derived pool address:", poolAddress);

    const response = {
      vid: vanityKeypair.id,
      success: true,
      tokenMint: tokenMint,
      poolAddress: poolAddress,
      poolTx: poolTx
        .serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        })
        .toString("base64"),
      metadataUrl,
      imageUrl,
      message: `DBC token launch ready! ${tokenName} (${tokenTicker}) will start with $${initialMarketCap.toLocaleString()} market cap and migrate at $${migrationMarketCap.toLocaleString()}. DBC will create the token mint automatically.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.log("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function uploadTokenImage(
  base64Image: string,
  mint: string
): Promise<string | false> {
  try {
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return false;
    }

    const [, contentType, base64Data] = matches;
    if (!contentType || !base64Data) {
      return false;
    }

    const fileBuffer = Buffer.from(base64Data, "base64");
    const fileName = `tokens/${mint}.${contentType.split("/")[1]}`;

    await uploadToSpaces(fileBuffer, contentType, fileName);
    return `${DO_SPACES_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    return false;
  }
}

async function uploadTokenMetadata(params: {
  tokenName: string;
  tokenTicker: string;
  tokenDescription?: string;
  imageUrl?: string;
  mint: string;
  twitter?: string;
  website?: string;
  telegram?: string;
}): Promise<string | false> {
  try {
    const metadata = {
      name: params.tokenName,
      symbol: params.tokenTicker,
      description: params.tokenDescription || "",
      image: params.imageUrl || "",
      twitter: params.twitter || "",
      website: params.website || "",
      telegram: params.telegram || "",
      attributes: [
        {
          trait_type: "Platform",
          value: "Medfun",
        },
        {
          trait_type: "DEX",
          value: "Medfun",
        },
      ],
      tags: ["Medfun", "MEME", "#ONLY"],
    };

    const fileName = `metadata/${params.mint}.json`;
    await uploadToSpaces(
      Buffer.from(JSON.stringify(metadata, null, 2)),
      "application/json",
      fileName
    );
    return `${DO_SPACES_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    return false;
  }
}

async function uploadToSpaces(
  fileBuffer: Buffer,
  contentType: string,
  fileName: string
) {
  return new Promise((resolve, reject) => {
    const command = new PutObjectCommand({
      Bucket: DO_SPACES_BUCKET!,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: "public-read",
    });

    s3Client
      .send(command)
      .then((data) => resolve(data))
      .catch((err) => {
        reject(err);
      });
  });
}
