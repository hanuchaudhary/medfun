"use client";

import React, { useEffect, createContext, useContext } from "react";
import { addRecentToken } from "./recently-opened";
import { useTokenPolling } from "@/hooks/use-token-polling";
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
  const { token: currentToken } = useTokenPolling(tokenMint);

  useEffect(() => {
    if (currentToken) {
      addRecentToken({
        id: tokenMint,
        name: currentToken.name || "Unknown Token",
        symbol: currentToken.symbol || "???",
        image:
          currentToken.imageUrl ||
          "https://i.pinimg.com/1200x/b7/8f/02/b78f023aa1bca7bdada28db1c30d1fe5.jpg",
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
