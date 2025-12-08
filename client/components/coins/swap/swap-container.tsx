"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduatedSwapSection } from "@/components/coins/swap/graduated-swap-section";
import { Connection } from "@solana/web3.js";
import { CpAmm } from "@meteora-ag/cp-amm-sdk";
import { TOKEN_POOL_ADDRESS } from "@/app/constant";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { SwapSection } from "./swap-section";

interface SwapContainerProps {
  mint: string;
}

export function SwapContainer({ mint }: SwapContainerProps) {
  const [isGraduated, setIsGraduated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

  const connection = useMemo(
    () => new Connection(process.env.NEXT_PUBLIC_RPC_URL!, "confirmed"),
    []
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("swap.activeTab");
      if (saved === "buy" || saved === "sell") {
        setActiveTab(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("swap.activeTab", activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cpAmm = new CpAmm(connection);
        const dbcClient = new DynamicBondingCurveClient(connection, "confirmed");
        const state = await dbcClient.state.getPool(TOKEN_POOL_ADDRESS);
        const poolStatus = (state as any)?.isMigrated;
        if (!cancelled) {
          setIsGraduated(!!poolStatus);
        }
      } catch (e) {
        if (!cancelled) {
          setIsGraduated(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  if (isGraduated === null) {
    return null;
  }

  return isGraduated ? (
    <GraduatedSwapSection activeTab={activeTab} onTabChange={setActiveTab} />
  ) : (
    <SwapSection tokenId={mint} />
  );
}

export default SwapContainer;


