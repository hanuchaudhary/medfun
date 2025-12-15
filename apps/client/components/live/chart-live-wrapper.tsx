"use client";

import ChartLiveClient from "../coins/token/ChartLiveClient";

export function ChartLiveWrapper({ mintAddress }: { mintAddress: string }) {
  return <ChartLiveClient mintAddress={mintAddress} />;
}
