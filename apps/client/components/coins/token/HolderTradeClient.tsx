"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatNumber, getTimeSince } from "@/lib/utils";
import React from "react";
import { RealtimeChat } from "@/components/realtime-chat";
import { useWallet } from "@/hooks/use-wallet";
import { useTokenStore } from "@/store/tokenStore";
import { ChatMessage } from "@/hooks/use-realtime-chat";

interface HolderTradeClientProps {
  mintAddress: string;
}

export default function HolderTradeClient({
  mintAddress,
}: HolderTradeClientProps) {
  const TOTAL_SUPPLY = 1000000000;
  const wallet = useWallet();
  const username = formatAddress(wallet.publicKey?.toString() || "Anonymous");

  const { holders, isLoadingHolders, fetchHolders } = useTokenStore();
  const { trades, isLoadingTrades, fetchTrades } = useTokenStore();

  const handleOnMessage = (messages: ChatMessage[]) => {
    console.log("mes: ", messages);
    if (messages.length > 0) {
      console.log("last: ", messages[messages.length - 1]);
    }
  };

  React.useEffect(() => {
    fetchHolders(mintAddress);
    fetchTrades(mintAddress, 50);

    const interval = setInterval(() => {
      fetchHolders(mintAddress, true);
      fetchTrades(mintAddress, 50, 0, true);
    }, 50000);

    return () => clearInterval(interval);
  }, [mintAddress, fetchHolders, fetchTrades]);

  return (
    <div className="w-full">
      <Tabs defaultValue="trades" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="">
            <TabsTrigger value="trades">
              Recent Trades({trades?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="holders">
              Top Holders({holders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="mt-0 h-full">
          <RealtimeChat
            roomName={`token-${mintAddress}`}
            username={username}
            onMessage={handleOnMessage}
          />
        </TabsContent>

        <TabsContent value="holders" className="mt-0">
          <div className="overflow-x-auto max-h-125 overflow-y-auto">
            {isLoadingHolders ? (
              <div className="space-y-2 p-3">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-dashed">
                  <tr className="text-muted-foreground">
                    <th className="text-left p-2 font-medium text-[13px]">#</th>
                    <th className="text-left p-2 font-medium text-[13px]">
                      Address
                    </th>
                    <th className="text-right p-2 font-medium text-[13px]">
                      % Owned
                    </th>
                    <th className="text-right p-2 font-medium text-[13px]">
                      SOL Bal
                    </th>
                    <th className="text-right p-2 font-medium text-[13px]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {holders?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No holders data available
                      </td>
                    </tr>
                  ) : (
                    holders?.slice(0, 20).map((holder, index) => {
                      const percentage = (
                        (holder.amount / TOTAL_SUPPLY) *
                        100
                      ).toFixed(2);
                      return (
                        <tr
                          key={holder.id}
                          className="border-b hover:bg-accent/50 transition-colors"
                        >
                          <td className="p-2 text-muted-foreground">
                            #{index + 1}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`https://solscan.io/account/${holder.holderAddress}?cluster=devnet`}
                                target="_blank"
                                className="inline-flex text-xs items-center gap-1 hover:text-primary transition-colors font-mono"
                              >
                                {formatAddress(holder.holderAddress)}
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </td>
                          <td className="p-2 text-right font-medium text-xs font-mono">
                            {percentage}%
                          </td>
                          <td className="p-2 text-right font-medium">-</td>
                          <td className="p-2 text-right font-medium font-mono text-xs">
                            {formatNumber(holder.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trades" className="mt-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {isLoadingTrades ? (
              <div className="space-y-2 p-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-dashed">
                  <tr className="text-muted-foreground">
                    <th className="text-left p-2 font-medium text-xs">
                      Date/Age
                    </th>
                    <th className="text-left p-2 font-medium text-xs">Type</th>
                    <th className="text-right p-2 font-medium text-xs">
                      Price (SOL)
                    </th>
                    <th className="text-right p-2 font-medium text-xs">
                      Token Amount
                    </th>
                    <th className="text-right p-2 font-medium text-xs">
                      SOL Amount
                    </th>
                    <th className="text-right p-2 font-medium text-xs">
                      Trader
                    </th>
                  </tr>
                </thead>
                <tbody className="h-30">
                  {trades?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No trades data available
                      </td>
                    </tr>
                  ) : (
                    trades?.map((trade) => {
                      const isBuy = trade.type === "BUY";
                      return (
                        <tr
                          key={trade.id}
                          className="border-b hover:bg-accent/50 transition-colors"
                        >
                          <td className="p-2">
                            <span className="lowercase text-xs">
                              {getTimeSince(trade.timestamp)}
                            </span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`text-xs py-1 px-2 rounded capitalize ${
                                isBuy
                                  ? "bg-primary/10 text-primary"
                                  : "bg-[#F10D11]/10 text-[#F10D11]"
                              }`}
                            >
                              {trade.type}
                            </span>
                          </td>
                          <td className="p-2 text-right font-medium text-xs font-mono">
                            {Number(trade.price).toFixed(10)}
                          </td>
                          <td className="p-2 text-right font-medium text-xs font-mono">
                            {formatNumber(trade.tokenAmount)}
                          </td>
                          <td className="p-2 text-right font-medium text-xs font-mono">
                            {trade.solAmount.toFixed(6)}
                          </td>
                          <td className="p-2 text-right normal-case">
                            <Link
                              href={`https://solscan.io/tx/${trade.signature}?cluster=devnet`}
                              target="_blank"
                              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <span className="font-mono text-xs">
                                {formatAddress(trade.traderAddress)}
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
