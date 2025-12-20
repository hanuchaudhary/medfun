import { MigrationCard } from "@/components/coins/migration-card";
import React from "react";

export default async function page({
  params,
}: {
  params: Promise<{ tokenMint: string }>  ;
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
