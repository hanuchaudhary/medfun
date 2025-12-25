"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { useCurrentToken } from "./token-page-wrapper";
import { cn, formatNumber } from "@/lib/utils";
import { useTokenStore } from "@/store/tokenStore";

interface TokenDetailsProps {
  tokenMint: string;
}

export function TokenDetails({ tokenMint }: TokenDetailsProps) {
  const contextToken = useCurrentToken();
  const { currentToken, isLoadingCurrentToken, fetchTokenDetails } =
    useTokenStore();
  const token = contextToken || currentToken;

  React.useEffect(() => {
    if (!contextToken) {
      fetchTokenDetails(tokenMint);
    }
  }, [tokenMint, contextToken, fetchTokenDetails]);

  const formatPrice = (
    marketCap: number | null,
    supply: number = 1000000000
  ) => {
    if (marketCap === null || marketCap === undefined) return "$0.000000";
    return `$${(marketCap / supply).toFixed(6)}`;
  };

  if (isLoadingCurrentToken && !token) {
    return (
      <div className="border-b p-2 animate-pulse">
        <div className="h-84 bg-muted"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="border-b p-8">
        <p className="text-destructive">Token not found</p>
      </div>
    );
  }

  const progress = token.graduatedPoolAddress
    ? 100
    : (token.bondingCurveProgress ?? 0);

  return (
    <div className="p-4">
      <div className="">
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
            <Image
              src={
                token.imageUrl ||
                "https://i.pinimg.com/1200x/b7/8f/02/b78f023aa1bca7bdada28db1c30d1fe5.jpg"
              }
              alt={token.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold leading-none">{token.name}</h1>
              <Badge variant="secondary" className="rounded-sm text-primary">
                {token.symbol}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{token.description}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          <div className="text-xs">
            <p className="text-muted-foreground">Price</p>
            <p className="font-mono font-semibold">
              {formatPrice(token.marketCap)}
            </p>
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">MC</p>
            <p className="font-mono font-semibold">
              {formatNumber(token.marketCap)}
            </p>
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Vo. 24h</p>
            <p className="font-mono font-semibold">
              {formatNumber(token.volume)}
            </p>
          </div>
          <div className="text-xs">
            <p className="text-muted-foreground">Liquidity</p>
            <p className="font-mono font-semibold">
              {formatNumber(token.liquidity)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              Bonding Curve Progress
            </span>
            <span
              className={cn(
                "font-medium font-mono text-primary",
                progress === 100 ? "text-yellow-400" : ""
              )}
            >
              {progress.toFixed(2)}%
            </span>
          </div>
          <Progress
            isGraduated={progress >= 100}
            value={progress}
            className="h-6"
          />
        </div>
      </div>
    </div>
  );
}
