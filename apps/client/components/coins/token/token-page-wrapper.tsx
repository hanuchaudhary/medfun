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
    fetchTrades,
    unsubscribeFromToken,
    currentTimeframe,
    lastViewedMint,
    clearTokenState,
  } = useTokenStore();

  const holdersIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenDetailsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const klinesIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tradesIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (lastViewedMint && lastViewedMint !== tokenMint) {
      clearTokenState();
    }

    fetchTokenDetails(tokenMint);
    fetchHolders(tokenMint);
    fetchTrades(tokenMint, 50);
    fetchKlines(tokenMint, currentTimeframe);

    subscribeToToken(tokenMint);

    holdersIntervalRef.current = setInterval(() => {
      fetchHolders(tokenMint, true);
    }, 15000);

    tokenDetailsIntervalRef.current = setInterval(() => {
      fetchTokenDetails(tokenMint, true);
    }, 20000);

    tradesIntervalRef.current = setInterval(() => {
      fetchTrades(tokenMint, 50, undefined, true);
    }, 35000);

    return () => {
      unsubscribeFromToken(tokenMint);
      if (holdersIntervalRef.current) clearInterval(holdersIntervalRef.current);
      if (tokenDetailsIntervalRef.current)
        clearInterval(tokenDetailsIntervalRef.current);
      if (tradesIntervalRef.current) clearInterval(tradesIntervalRef.current);
    };
  }, [
    tokenMint,
    fetchTokenDetails,
    fetchHolders,
    fetchKlines,
    subscribeToToken,
    unsubscribeFromToken,
  ]);

  useEffect(() => {
    if (klinesIntervalRef.current) clearInterval(klinesIntervalRef.current);
    fetchKlines(tokenMint, currentTimeframe);

    klinesIntervalRef.current = setInterval(() => {
      fetchKlines(tokenMint, currentTimeframe, true);
    }, 10000);

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
