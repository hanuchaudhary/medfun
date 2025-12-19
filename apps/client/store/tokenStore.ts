import { Token, Holder, Trade, Kline } from "@/types/token";
import axios from "axios";
import { create } from "zustand";

interface TokenStore {
  tokens: Token[];
  isLoadingTokens: boolean;
  fetchTokens: (isBackgroundRefresh?: boolean) => Promise<void>;

  trendingTokens: Token[];
  isLoadingTrendingTokens: boolean;
  fetchTrendingTokens: (
    limit?: number,
    isBackgroundRefresh?: boolean
  ) => Promise<void>;

  userTokens: Token[];
  isLoadingUserTokens: boolean;
  fetchUserTokens: (
    userAddress: string,
    isBackgroundRefresh?: boolean
  ) => Promise<void>;

  currentToken: Token | null;
  isLoadingCurrentToken: boolean;
  fetchTokenDetails: (
    mintAddress: string,
    isBackgroundRefresh?: boolean
  ) => Promise<void>;

  holders: Holder[];
  isLoadingHolders: boolean;
  fetchHolders: (
    mintAddress: string,
    isBackgroundRefresh?: boolean
  ) => Promise<void>;

  trades: Trade[];
  isLoadingTrades: boolean;
  fetchTrades: (
    mintAddress: string,
    limit?: number,
    offset?: number,
    isBackgroundRefresh?: boolean
  ) => Promise<void>;

  klines: Kline[];
  isLoadingKlines: boolean;
  fetchKlines: (
    mintAddress: string,
    interval?: string,
    isBackgroundRefresh?: boolean
  ) => Promise<void>;
}

export const useTokenStore = create<TokenStore>((set, get) => ({
  tokens: [],
  isLoadingTokens: false,
  fetchTokens: async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        set({ isLoadingTokens: true });
      }
      const res = await axios.get("/api/coins");
      if (res.data.success) {
        set({ tokens: res.data.tokens, isLoadingTokens: false });
      } else {
        set({ isLoadingTokens: false });
        console.error("Error fetching tokens:", res.data.error);
      }
    } catch (error) {
      set({ isLoadingTokens: false });
      console.error("Error fetching tokens:", error);
    }
  },

  trendingTokens: [],
  isLoadingTrendingTokens: false,
  fetchTrendingTokens: async (limit = 3, isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        set({ isLoadingTrendingTokens: true });
      }
      const res = await axios.get(`/api/coins/trending?limit=${limit}`);
      if (res.data.success) {
        set({
          trendingTokens: res.data.tokens,
          isLoadingTrendingTokens: false,
        });
      } else {
        set({ isLoadingTrendingTokens: false });
        console.error("Error fetching trending tokens:", res.data.error);
      }
    } catch (error) {
      set({ isLoadingTrendingTokens: false });
      console.error("Error fetching trending tokens:", error);
    }
  },

  userTokens: [],
  isLoadingUserTokens: false,
  fetchUserTokens: async (userAddress: string, isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        set({ isLoadingUserTokens: true });
      }
      const res = await axios.get(`/api/coins/user/${userAddress}`);
      if (res.data.success) {
        set({ userTokens: res.data.tokens, isLoadingUserTokens: false });
      } else {
        set({ isLoadingUserTokens: false });
        console.error("Error fetching user tokens:", res.data.error);
      }
    } catch (error) {
      set({ isLoadingUserTokens: false });
      console.error("Error fetching user tokens:", error);
    }
  },

  currentToken: null,
  isLoadingCurrentToken: false,
  fetchTokenDetails: async (
    mintAddress: string,
    isBackgroundRefresh = false
  ) => {
    try {
      if (!isBackgroundRefresh) {
        set({ isLoadingCurrentToken: true });
      }
      const res = await axios.get(`/api/coins/${mintAddress}`);

      if (res.data.success && res.data.token) {
        set({ currentToken: res.data.token, isLoadingCurrentToken: false });
      } else {
        set({ isLoadingCurrentToken: false });
        console.error("Error fetching token details:", res.data.error);
      }
    } catch (error) {
      set({ isLoadingCurrentToken: false });
      console.error("Error fetching token details:", error);
    }
  },

  holders: [],
  isLoadingHolders: false,
  fetchHolders: async (mintAddress: string, isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        set({ isLoadingHolders: true });
      }
      const res = await axios.get(`/api/coins/${mintAddress}/holders`);
      if (res.data.success) {
        set({ holders: res.data.holders, isLoadingHolders: false });
      } else {
        set({ isLoadingHolders: false });
        console.error("Error fetching holders:", res.data.error);
      }
    } catch (error) {
      set({ isLoadingHolders: false });
      console.error("Error fetching holders:", error);
    }
  },

  trades: [],
  isLoadingTrades: false,
  fetchTrades: async (
    mintAddress: string,
    limit = 100,
    offset = 0,
    isBackgroundRefresh = false
  ) => {
    try {
      if (!isBackgroundRefresh) {
        set({ isLoadingTrades: true });
      }
      const res = await axios.get(
        `/api/coins/${mintAddress}/transactions?limit=${limit}&offset=${offset}`
      );
      if (res.data.success) {
        set({ trades: res.data.transactions, isLoadingTrades: false });
      } else {
        set({ isLoadingTrades: false });
        console.error("Error fetching trades:", res.data.error);
      }
    } catch (error) {
      set({ isLoadingTrades: false });
      console.error("Error fetching trades:", error);
    }
  },

  klines: [],
  isLoadingKlines: false,
  fetchKlines: async (
    mintAddress: string,
    interval = "1m",
    isBackgroundRefresh = false
  ) => {
    try {
      if (!isBackgroundRefresh) {
        set({ isLoadingKlines: true });
      }
      const res = await axios.get(
        `/api/coins/${mintAddress}/chart?tf=${interval}`
      );
      if (res.data.klines) {
        set({ klines: res.data.klines, isLoadingKlines: false });
      } else {
        set({ isLoadingKlines: false });
        console.error("Error fetching klines:", res.data.error);
      }
    } catch (error) {
      set({ isLoadingKlines: false });
      console.error("Error fetching klines:", error);
    }
  },
}));
