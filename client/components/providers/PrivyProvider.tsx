"use client";

import React from "react";
import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProviderBase
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          embeddedWallets: {
            solana: {
              createOnLogin: "users-without-wallets",
            },
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          appearance: {
            walletChainType: "ethereum-and-solana",
            theme: "#000000",
            accentColor: "#6bbd6f",
            logo: "/logogreen.png",
            // showWalletLoginFirst: true,
          },
          externalWallets: {
            solana: { connectors: toSolanaWalletConnectors() },
          },
          solana: {
            rpcs: {
              "solana:mainnet": {
                rpc: createSolanaRpc(
                  process.env.NEXT_PUBLIC_RPC_URL ||
                    "https://api.mainnet-beta.solana.com"
                ),
                rpcSubscriptions: createSolanaRpcSubscriptions(
                  process.env.NEXT_PUBLIC_RPC_URL?.replace("http", "ws") ||
                    "wss://api.mainnet-beta.solana.com"
                ),
              },
              // "solana:devnet": {
              //   rpc: createSolanaRpc("https://api.devnet.solana.com"),
              //   rpcSubscriptions: createSolanaRpcSubscriptions(
              //     "wss://api.devnet.solana.com"
              //   ),
              // },
            },
          },
        }}
      >
        {children}
      </PrivyProviderBase>
    </QueryClientProvider>
  );
}
