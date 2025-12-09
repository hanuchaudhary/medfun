"use client";

import React, { useEffect } from "react";
import { addRecentToken } from "./recently-opened";
import { useTokenStore } from "@/store/tokenStore";

interface TokenPageWrapperProps {
  tokenMint: string;
  children: React.ReactNode;
}

const formatPrice = (marketCap: number | null, supply: number = 1000000000) => {
  if (marketCap === null || marketCap === undefined) return "$0.000000";
  return `$${(marketCap / supply).toFixed(6)}`;
};

export function TokenPageWrapper({
  tokenMint,
  children,
}: TokenPageWrapperProps) {
  const {
    currentToken,
    fetchTokenDetails,
    fetchHolders,
    fetchTrades,
    fetchKlines,
  } = useTokenStore();

  useEffect(() => {
    fetchTokenDetails(tokenMint);
    fetchHolders(tokenMint);
    fetchTrades(tokenMint, 50);
    fetchKlines(tokenMint, "1_HOUR");
  }, [tokenMint, fetchTokenDetails, fetchHolders, fetchTrades, fetchKlines]);

  useEffect(() => {
    // const pollInterval = setInterval(() => {
      fetchTokenDetails(tokenMint, true);
      fetchHolders(tokenMint, true);
      fetchTrades(tokenMint, 50, 0, true);
      fetchKlines(tokenMint, "1_HOUR", true);
    // }, 10000);

    // return () => {
    //   clearInterval(pollInterval);
    // };
  }, [tokenMint, fetchTokenDetails, fetchHolders, fetchTrades, fetchKlines]);

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

  return <>{children}</>;
}
