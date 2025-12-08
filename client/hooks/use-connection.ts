"use client";

import { useMemo } from "react";
import { Connection, clusterApiUrl } from "@solana/web3.js";

export function useConnection() {
  const connection = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("mainnet-beta");
    return new Connection(rpcUrl, "confirmed");
  }, []);

  return { connection };
}
