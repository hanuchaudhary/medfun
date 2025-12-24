import { MigrationCard } from "@/components/coins/migration-card";
import React from "react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tokenMint: string }>;
}): Promise<Metadata> {
  const { tokenMint } = await params;
  return {
    title: `Migrate Token ${tokenMint.slice(0, 8)}...`,
    description: `Migrate your token ${tokenMint} to Raydium on med.fun - seamless liquidity migration for your Solana token.`,
    openGraph: {
      title: `Token Migration | med.fun`,
      description: `Migrate your token to Raydium on med.fun.`,
    },
  };
}

export default async function page({
  params,
}: {
  params: Promise<{ tokenMint: string }>;
}) {
  const { tokenMint } = await params;
  return (
    <div className="max-w-2xl flex items-center justify-center mx-auto">
      <MigrationCard
        tokenMint={tokenMint}
        tokenName={"Medfun Token"}
        tokenSymbol={"MEDFUN"}
        poolAddress={"GygZRpipwQCTuMMw9t8XSQETmFgBfhk4ED4wY5b13ZmR"}
        configAddress={"CUdxMBkGwYVJHmxBHpJcv2PLoYEULcVKFQGbiS8fahew"}
      />
    </div>
  );
}
