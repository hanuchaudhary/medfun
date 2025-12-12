"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseClient } from "@/lib/supabaseClient";
import { formatAddress, formatNumber, getTimeSince } from "@/lib/utils";
import React from "react";
import { Holder, Trade } from "@/types/token";
import { subscribeToTableChanges } from "@/lib/realtime";

interface HolderTradeClientProps {
  mintAddress: string;
  holders: Holder[];
  trades: Trade[];
}

export default function HolderTradeClient({
  mintAddress,
  holders,
  trades,
}: HolderTradeClientProps) {
  const TOTAL_SUPPLY = 1000000000;
  const isLoadingHolders = false;
  const isLoadingTrades = false;

  const [tradesState, setTradesState] = React.useState<Trade[]>(trades);
  const [holdersState, setHoldersState] = React.useState<Holder[]>(holders);

  React.useEffect(() => {
    const channel = subscribeToTableChanges({
      table: "holder",
      mintAddress,
      callback: (payload: any) => {
        console.log("HOLDER CHANGE:", payload);
        if (payload.eventType === "UPDATE") {
          setHoldersState((prevHolderState) => {
            const index = prevHolderState.findIndex(
              (holder) => holder.id === payload.new.id
            );
            if (index !== -1) {
              const updatedHolders = [...prevHolderState];
              updatedHolders[index] = payload.new;
              return updatedHolders;
            }
            return prevHolderState;
          });
        } else if (payload.eventType === "INSERT") {
          setHoldersState((prevHolderState) => [
            ...prevHolderState,
            payload.new,
          ]);
        }
      },
    });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [mintAddress]);

  React.useEffect(() => {
    const channel = subscribeToTableChanges({
      table: "trade",
      mintAddress,
      callback: (payload: any) => {
        console.log("TRADE CHANGE:", payload);
        if (payload.eventType === "UPDATE") {
          setTradesState((prevTradeState) => {
            const index = prevTradeState.findIndex(
              (trade) => trade.id === payload.new.id
            );
            if (index !== -1) {
              const updatedTrades = [...prevTradeState];
              updatedTrades[index] = payload.new;
              return updatedTrades;
            }
            return prevTradeState;
          });
        } else if (payload.eventType === "INSERT") {
          setTradesState((prevTradeState) => [payload.new, ...prevTradeState]);
        }
      },
    });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [mintAddress]);

  return (
    <div className="w-full">
      <Tabs defaultValue="trades" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="">
            <TabsTrigger value="trades">
              Recent Trades({tradesState?.length})
            </TabsTrigger>
            <TabsTrigger value="holders">
              Top Holders({holdersState?.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="holders" className="mt-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {isLoadingHolders ? (
              <div className="space-y-2 p-3">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-muted-foreground">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Address</th>
                    <th className="text-right p-3 font-medium">% Owned</th>
                    <th className="text-right p-3 font-medium">SOL Bal</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {holdersState.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No holders data available
                      </td>
                    </tr>
                  ) : (
                    holdersState.slice(0, 20).map((holder, index) => {
                      const percentage = (
                        (holder.amount / TOTAL_SUPPLY) *
                        100
                      ).toFixed(2);
                      return (
                        <tr
                          key={holder.id}
                          className="border-b hover:bg-accent/50 transition-colors"
                        >
                          <td className="p-3 text-muted-foreground">
                            #{index + 1}
                          </td>
                          <td className="p-3">
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
                          <td className="p-3 text-right font-medium text-xs">
                            {percentage}%
                          </td>
                          <td className="p-3 text-right font-medium">-</td>
                          <td className="p-3 text-right font-medium">
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
                <thead className="border-b">
                  <tr className="text-muted-foreground">
                    <th className="text-left p-3 font-medium">Date/Age</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-right p-3 font-medium">Price (SOL)</th>
                    <th className="text-right p-3 font-medium">Token Amount</th>
                    <th className="text-right p-3 font-medium">SOL Amount</th>
                    <th className="text-right p-3 font-medium">Trader</th>
                  </tr>
                </thead>
                <tbody className="h-30">
                  {tradesState.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No trades data available
                      </td>
                    </tr>
                  ) : (
                    tradesState.map((trade) => {
                      const isBuy = trade.type === "BUY";
                      return (
                        <tr
                          key={trade.id}
                          className="border-b hover:bg-accent/50 transition-colors"
                        >
                          <td className="p-3">
                            <span className="lowercase text-xs">
                              {getTimeSince(trade.timestamp)}
                            </span>
                          </td>
                          <td className="p-3">
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
                          <td className="p-3 text-right font-medium">
                            {trade.price.toFixed(10)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatNumber(trade.tokenAmount)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {trade.solAmount.toFixed(6)}
                          </td>
                          <td className="p-3 text-right normal-case">
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
