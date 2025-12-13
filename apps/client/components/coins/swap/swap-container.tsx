"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduatedSwapSection } from "@/components/coins/swap/graduated-swap-section";
import { Connection, PublicKey } from "@solana/web3.js";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { SwapSection } from "./swap-section";
import { useCurrentToken } from "../token/token-page-wrapper";

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

  const ct = useCurrentToken();
  useEffect(() => {
    if (!ct?.poolAddress) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const dbcClient = new DynamicBondingCurveClient(
          connection,
          "confirmed"
        );
        console.log("POOL: ", ct.poolAddress);

        const state = await dbcClient.state.getPool(
          new PublicKey(ct.poolAddress)
        );
        const poolStatus = (state as any)?.isMigrated;
        console.log("Pool state", poolStatus);

        if (!cancelled) {
          setIsGraduated(!!poolStatus);
        }
      } catch (e) {
        console.error("Error fetching pool state:", e);
        if (!cancelled) {
          setIsGraduated(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, ct?.poolAddress]);

  if (isGraduated === null) {
    return null;
  }

  return isGraduated ? (
    <GraduatedSwapSection activeTab={activeTab} onTabChange={setActiveTab} />
  ) : (
    <SwapSection tokenmint={mint} />
  );
}

export default SwapContainer;
