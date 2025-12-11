import { MigrationCard } from "@/components/coins/migration-card";
import React from "react";

export default function page() {
  return (
    <div className="max-w-2xl flex items-center justify-center mx-auto">
    <MigrationCard
      tokenId={"2LAvvbpJCQ4z7ynfyW67A2mUiUUPpwbXsk8gMF3X6ER2"}
      tokenName={"OnlyFunders Token"}
      tokenSymbol={"OFT"}
      poolAddress={"GygZRpipwQCTuMMw9t8XSQETmFgBfhk4ED4wY5b13ZmR"}
      configAddress={"CUdxMBkGwYVJHmxBHpJcv2PLoYEULcVKFQGbiS8fahew"}
    />
    </div>
  );
}
