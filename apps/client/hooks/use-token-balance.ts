import { useState, useCallback } from "react";
import { getTokenBalance } from "@/lib/helius";
import { Address } from "@solana/kit";

interface UseTokenBalanceProps {
  owner?: string;
  mint?: string;
}

export function useTokenBalance({ owner, mint }: UseTokenBalanceProps = {}) {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!owner || !mint) {
      console.log("Missing owner or mint, skipping fetch");
      setBalance(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Calling getTokenBalance...");
      const tokenBalance = await getTokenBalance(
        owner as Address,
        mint as Address
      );
      console.log("Token balance received:", tokenBalance);
      setBalance(tokenBalance);
    } catch (err) {
      console.error("Error fetching token balance:", err);
      const error =
        err instanceof Error ? err : new Error("Failed to fetch token balance");
      setError(error);
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [owner, mint]);

  const refetch = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch,
    fetchBalance,
  };
}
