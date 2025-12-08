"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { useTokenStore } from "@/store/tokenStore";

interface TokenDetailsProps {
  tokenMint: string;
}

export function TokenDetails({ tokenMint }: TokenDetailsProps) {
  const { currentToken, isLoadingCurrentToken } = useTokenStore();

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return "$0";
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPrice = (
    marketCap: number | null,
    supply: number = 1000000000
  ) => {
    if (marketCap === null || marketCap === undefined) return "$0.000000";
    return `$${(marketCap / supply).toFixed(6)}`;
  };

  if (isLoadingCurrentToken) {
    return (
      <div className="border-b p-2   animate-pulse">
        <div className="h-84 bg-muted"></div>
      </div>
    );
  }

  if (!currentToken) {
    return (
      <div className="border-b   p-8">
        <p className="text-destructive">Token not found</p>
      </div>
    );
  }

  const progress = currentToken.bondingCurveProgress ?? 0;

  return (
    <div className="border-b  ">
      <div className="">
        <div className="flex items-start gap-4 border-b">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={
                currentToken.imageUrl ||
                "https://i.pinimg.com/1200x/b7/8f/02/b78f023aa1bca7bdada28db1c30d1fe5.jpg"
              }
              alt={currentToken.name}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mt-2">
              <h1 className="text-2xl font-bold">{currentToken.name}</h1>
              <Badge variant="secondary" className="rounded-none">
                {currentToken.symbol}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentToken.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y mb-4">
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Price</p>
            <p className="text-xl">{formatPrice(currentToken.marketCap)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
            <p className="text-xl">{formatNumber(currentToken.marketCap)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Volume 24h</p>
            <p className="text-xl">{formatNumber(currentToken.volume)}</p>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Liquidity</p>
            <p className="text-xl">{formatNumber(currentToken.liquidity)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-xs px-4">
            <span className="text-muted-foreground">
              Bonding Curve Progress
            </span>
            <span className="font-medium">{progress.toFixed(2)}%</span>
          </div>
          <Progress value={progress} className="h-8" />
        </div>
      </div>
    </div>
  );
}
