import { useState, useEffect, useCallback } from "react";
import { Token } from "@/types/token";
import { updateTokenWithJupiterData } from "@/lib/actions";
import { supabaseClient } from "@/lib/supabaseClient";

export function useTokenPolling(mintAddress: string | null) {
  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchToken = useCallback(async () => {
    if (!mintAddress) return;

    try {
      const result = await updateTokenWithJupiterData(mintAddress);
      if (result.success && result.token) {
        setToken(result.token as Token);
        setError(null);
      } else {
        throw new Error(result.error || "Failed to fetch token");
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching token:", err);
    } finally {
      setIsLoading(false);
    }
  }, [mintAddress]);

  useEffect(() => {
    if (!mintAddress) return;
    fetchToken();
    const interval = setInterval(() => {
      fetchToken();
    }, 30000);

    return () => clearInterval(interval);
  }, [mintAddress, fetchToken]);

  return { token, isLoading, error, refetch: fetchToken };
}

export function useTokensPolling(limit?: number) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      let query = supabaseClient
        .from("token")
        .select("*")
        .order("createdAt", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTokens((data as Token[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching tokens:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(() => {
      fetchTokens();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}

export function useTrendingTokensPolling(limit: number = 10) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from("token")
        .select("*")
        .order("volume", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTokens((data as Token[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching trending tokens:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(() => {
      fetchTokens();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}

export function useUserTokensPolling(creatorAddress: string | null) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!creatorAddress) return;

    try {
      const { data, error } = await supabaseClient
        .from("token")
        .select("*")
        .eq("creatorAddress", creatorAddress)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setTokens((data as Token[]) || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching user tokens:", err);
    } finally {
      setIsLoading(false);
    }
  }, [creatorAddress]);

  useEffect(() => {
    if (!creatorAddress) return;
    fetchTokens();
    const interval = setInterval(() => {
      fetchTokens();
    }, 3000);

    return () => clearInterval(interval);
  }, [creatorAddress, fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}
