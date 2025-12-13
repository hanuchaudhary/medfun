"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import React from "react";
import { useCurrentToken } from "./token-page-wrapper";
import { formatNumber } from "@/lib/utils";

interface TokenDetailsProps {
  tokenMint: string;
}

export function TokenDetails({ tokenMint }: TokenDetailsProps) {
  const currentToken = useCurrentToken();
  const isLoadingCurrentToken = !currentToken;

  const formatPrice = (
    marketCap: number | null,
    supply: number = 1000000000
  ) => {
    if (marketCap === null || marketCap === undefined) return "$0.000000";
    return `$${(marketCap / supply).toFixed(6)}`;
  };

  if (isLoadingCurrentToken) {
    return (
      <div className="border-b p-2 animate-pulse">
        <div className="h-84 bg-muted"></div>
      </div>
    );
  }

  if (!currentToken) {
    return (
      <div className="border-b p-8">
        <p className="text-destructive">Token not found</p>
      </div>
    );
  }

  const progress = currentToken.bondingCurveProgress ?? 0;

  return (
    <div className="border p-2 rounded-xl">
      <div className="">
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{currentToken.name}</h1>
              <Badge variant="secondary" className="rounded-sm text-primary">
                {currentToken.symbol}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentToken.description}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b ">
          <div className="">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-sm">{formatPrice(currentToken.marketCap)}</p>
          </div>
          <div className="">
            <p className="text-xs text-muted-foreground">MC</p>
            <p className="text-sm">{formatNumber(currentToken.marketCap)}</p>
          </div>
          <div className="">
            <p className="text-xs text-muted-foreground">Vo. 24h</p>
            <p className="text-sm">{formatNumber(currentToken.volume)}</p>
          </div>
          <div className="">
            <p className="text-xs text-muted-foreground">Liquidity</p>
            <p className="text-sm">{formatNumber(currentToken.liquidity)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-xs px-4">
            <span className="text-muted-foreground">
              Bonding Curve Progress
            </span>
            <span className="font-medium">{progress.toFixed(2)}%</span>
          </div>
          <Progress isGraduated={progress >= 100} value={progress} className="h-8" />
        </div>
      </div>
    </div>
  );
}
