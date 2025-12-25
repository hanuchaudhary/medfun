import HolderTradeClient from "./HolderTradeClient";

export function HoldersTradesTable({ mintAddress }: { mintAddress: string }) {
  return <HolderTradeClient mintAddress={mintAddress} />;
}
