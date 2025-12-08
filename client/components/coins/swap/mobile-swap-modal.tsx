"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowUpDown } from "lucide-react";
import { SwapSection } from "./swap-section";
import { GraduatedSwapSection } from "./graduated-swap-section";
import { Connection } from "@solana/web3.js";
import { CpAmm } from "@meteora-ag/cp-amm-sdk";
import { TOKEN_POOL_ADDRESS } from "@/app/constant";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";

interface MobileSwapModalProps {
  tokenId: string;
  tokenName?: string;
}

export function MobileSwapModal({ tokenId, tokenName }: MobileSwapModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [isGraduated, setIsGraduated] = useState<boolean | null>(null);

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
        const dbcClient = new DynamicBondingCurveClient(
          connection,
          "confirmed"
        );
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-4   left-4 right-4 z-40 md:hidden rounded-full shadow-lg h-14"
        >
          Buy {tokenName || "Token"}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[75vh] rounded-t-3xl overflow-hidden"
      >
        <div className="overflow-y-auto h-[calc(85vh-80px)]">
          {isGraduated ? (
            <GraduatedSwapSection
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          ) : (
            <SwapSection tokenId={tokenId} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
