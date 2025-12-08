import { MigrationCard } from "@/components/tokens/migration-card";
import React from "react";

export default function page() {
  return (
    <div className="max-w-2xl flex items-center justify-center mx-auto">
    <MigrationCard
      tokenId={"0"}
      tokenName={"OnlyFunders Token"}
      tokenSymbol={"OFT"}
      poolAddress={"PoolAddress"}
      configAddress={"ConfigAddress"}
    />
    </div>
  );
}
