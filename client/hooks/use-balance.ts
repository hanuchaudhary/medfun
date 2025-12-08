"use client";

import { useState, useEffect, useCallback } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection } from "./use-connection";

interface UseBalanceOptions {
  publicKey: PublicKey | null;
  refetchInterval?: number;
}

interface UseBalanceReturn {
  balance: number | null;
  balanceInLamports: number | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBalance({
  publicKey,
  refetchInterval = 30000,
}: UseBalanceOptions): UseBalanceReturn {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceInLamports, setBalanceInLamports] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      setBalanceInLamports(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lamports = await connection.getBalance(publicKey);
      setBalanceInLamports(lamports);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch balance");
      setError(error);
      console.error("Failed to fetch balance:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (!publicKey) return;

    // Fetch balance immediately
    fetchBalance();

    // Set up interval for refetching
    if (refetchInterval > 0) {
      const interval = setInterval(fetchBalance, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [publicKey, refetchInterval, fetchBalance]);

  return {
    balance,
    balanceInLamports,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
