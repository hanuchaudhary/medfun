"use client";

import React, { useEffect, createContext, useContext, useRef } from "react";
import { addRecentToken } from "./recently-opened";
import { useTokenStore } from "@/store/tokenStore";
import { Token } from "@/types/token";

interface TokenPageWrapperProps {
  tokenMint: string;
  children: React.ReactNode;
}

const formatPrice = (marketCap: number | null, supply: number = 1000000000) => {
  if (marketCap === null || marketCap === undefined) return "$0.000000";
  return `$${(marketCap / supply).toFixed(6)}`;
};

const TokenContext = createContext<Token | null>(null);

export function useCurrentToken() {
  return useContext(TokenContext);
}

export function TokenPageWrapper({
  tokenMint,
  children,
}: TokenPageWrapperProps) {
  const {
    currentToken,
    fetchTokenDetails,
    fetchHolders,
    fetchKlines,
    subscribeToToken,
    unsubscribeFromToken,
    currentTimeframe,
  } = useTokenStore();

  const holdersIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenDetailsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const klinesIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTokenDetails(tokenMint);
    fetchHolders(tokenMint);
    fetchKlines(tokenMint, currentTimeframe);
    subscribeToToken(tokenMint);

    holdersIntervalRef.current = setInterval(() => {
      fetchHolders(tokenMint, true);
    }, 5000);

    tokenDetailsIntervalRef.current = setInterval(() => {
      fetchTokenDetails(tokenMint, true);
    }, 10000);

    return () => {
      unsubscribeFromToken(tokenMint);
      if (holdersIntervalRef.current) clearInterval(holdersIntervalRef.current);
      if (tokenDetailsIntervalRef.current)
        clearInterval(tokenDetailsIntervalRef.current);
    };
  }, [
    tokenMint,
    fetchTokenDetails,
    fetchHolders,
    fetchKlines,
    subscribeToToken,
    unsubscribeFromToken,
    currentTimeframe,
  ]);

  useEffect(() => {
    if (klinesIntervalRef.current) clearInterval(klinesIntervalRef.current);

    klinesIntervalRef.current = setInterval(() => {
      fetchKlines(tokenMint, currentTimeframe, true);
    }, 5000);

    return () => {
      if (klinesIntervalRef.current) clearInterval(klinesIntervalRef.current);
    };
  }, [tokenMint, fetchKlines, currentTimeframe]);

  useEffect(() => {
    if (currentToken) {
      addRecentToken({
        id: tokenMint,
        name: currentToken.name || "Unknown Token",
        symbol: currentToken.symbol || "???",
        image: currentToken.imageUrl || "/medfun-logo-circle.png",
        price: formatPrice(currentToken.marketCap),
      });
    }
  }, [currentToken, tokenMint]);

  return (
    <TokenContext.Provider value={currentToken}>
      {children}
    </TokenContext.Provider>
  );
}
