import { Token, Holder, Trade, Kline } from "@/types/token";
import axios from "axios";
import { create } from "zustand";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

interface TradeEvent {
  type: "BUY" | "SELL";
  tokenMint: string;
  price: number;
  solAmount: number;
  tokenAmount: number;
  traderAddress: string;
  signature: string;
  timestamp: number;
}

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
  lastViewedMint: string | null;
  clearTokenState: () => void;
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
  currentTimeframe: string;
  setTimeframe: (timeframe: string) => void;
  fetchKlines: (
    mintAddress: string,
    interval?: string,
    isBackgroundRefresh?: boolean
  ) => Promise<void>;

  socket: WebSocket | null;
  isSocketConnected: boolean;
  subscribedTokenMint: string | null;

  connectSocket: () => void;
  disconnectSocket: () => void;
  subscribeToToken: (mintAddress: string) => void;
  unsubscribeFromToken: (mintAddress: string) => void;
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
  lastViewedMint: null,
  clearTokenState: () =>
    set({
      currentToken: null,
      holders: [],
      trades: [],
      klines: [],
    }),
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
        set({
          currentToken: res.data.token,
          isLoadingCurrentToken: false,
          lastViewedMint: mintAddress,
        });
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
  currentTimeframe: "1m",
  setTimeframe: (timeframe: string) => set({ currentTimeframe: timeframe }),
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

  socket: null,
  isSocketConnected: false,
  subscribedTokenMint: null,

  connectSocket: () => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connected");
      set({ socket: ws, isSocketConnected: true });

      const { subscribedTokenMint } = get();
      if (subscribedTokenMint) {
        ws.send(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: [`trade:${subscribedTokenMint}`],
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "trade" && message.data) {
          const tradeEvent: TradeEvent = message.data;
          const { trades, subscribedTokenMint, holders } = get();
          if (tradeEvent.tokenMint === subscribedTokenMint) {
            const newTrade: Trade = {
              type: tradeEvent.type,
              price: tradeEvent.price,
              tokenAmount: tradeEvent.tokenAmount,
              solAmount: tradeEvent.solAmount,
              traderAddress: tradeEvent.traderAddress,
              signature: tradeEvent.signature,
              timestamp: new Date(tradeEvent.timestamp * 1000).toISOString(),
              slot: 0,
              tokenMintAddress: tradeEvent.tokenMint,
            };

            set({ trades: [newTrade, ...trades].slice(0, 100) });

            const delta =
              tradeEvent.type === "BUY"
                ? tradeEvent.tokenAmount
                : -tradeEvent.tokenAmount;
            const existingHolderIndex = holders.findIndex(
              (h) => h.holderAddress === tradeEvent.traderAddress
            );

            if (existingHolderIndex >= 0) {
              const updatedHolders = [...holders];
              const existingHolder = updatedHolders[existingHolderIndex];
              if (existingHolder) {
                updatedHolders[existingHolderIndex] = {
                  id: existingHolder.id,
                  holderAddress: existingHolder.holderAddress,
                  tokenMintAddress: existingHolder.tokenMintAddress,
                  amount: existingHolder.amount + delta,
                };
              }
              const filteredHolders = updatedHolders.filter(
                (h) => h.amount > 0
              );
              set({ holders: filteredHolders });
            } else if (tradeEvent.type === "BUY") {
              set({
                holders: [
                  ...holders,
                  {
                    id: Date.now(),
                    holderAddress: tradeEvent.traderAddress,
                    amount: tradeEvent.tokenAmount,
                    tokenMintAddress: tradeEvent.tokenMint,
                  },
                ],
              });
            }
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      set({ socket: null, isSocketConnected: false });
      setTimeout(() => {
        const { subscribedTokenMint } = get();
        if (subscribedTokenMint) {
          get().connectSocket();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    set({ socket: ws });
  },

  disconnectSocket: () => {
    const { socket, subscribedTokenMint } = get();

    if (socket) {
      if (subscribedTokenMint && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            method: "UNSUBSCRIBE",
            params: [`trade:${subscribedTokenMint}`],
          })
        );
      }
      socket.close();
      set({
        socket: null,
        isSocketConnected: false,
        subscribedTokenMint: null,
      });
    }
  },

  subscribeToToken: (mintAddress: string) => {
    const { socket, subscribedTokenMint } = get();
    if (subscribedTokenMint && subscribedTokenMint !== mintAddress) {
      get().unsubscribeFromToken(subscribedTokenMint);
    }

    set({ subscribedTokenMint: mintAddress });
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      get().connectSocket();
      return;
    }

    socket.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: [`trade:${mintAddress}`],
      })
    );

    console.log(`Subscribed to trade:${mintAddress}`);
  },

  unsubscribeFromToken: (mintAddress: string) => {
    const { socket } = get();

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          method: "UNSUBSCRIBE",
          params: [`trade:${mintAddress}`],
        })
      );
      console.log(`Unsubscribed from trade:${mintAddress}`);
    }

    set({ subscribedTokenMint: null });
  },
}));