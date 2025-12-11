"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTokenStore } from "@/store/tokenStore";
import { Skeleton } from "@/components/ui/skeleton";

export function HoldersTradesTable() {
  const { holders, isLoadingHolders, trades, isLoadingTrades } =
    useTokenStore();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-3)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getTimeSince = (timestamp: string | Date) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const TOTAL_SUPPLY = 1_000_000_000;

  return (
    <div className="w-full">
      <Tabs defaultValue="trades" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="">
            <TabsTrigger value="trades">
              Recent Trades({trades.length})
            </TabsTrigger>
            <TabsTrigger value="holders">
              Top Holders({holders.length})
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
                  {holders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No holders data available
                      </td>
                    </tr>
                  ) : (
                    holders.slice(0, 20).map((holder, index) => {
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
                  {trades.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No trades data available
                      </td>
                    </tr>
                  ) : (
                    trades.map((trade) => {
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
