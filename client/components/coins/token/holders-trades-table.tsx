"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface Holder {
  id: string;
  rank: number;
  address: string;
  label?: string;
  percentage: string;
  solBalance: string;
  amount: string;
}

interface Trade {
  id: string;
  age: string;
  type: "Buy" | "Sell";
  price: string;
  volume: string;
  sol: string;
  trader: string;
}

interface HoldersTradesTableProps {
  tokenId: string;
}

export function HoldersTradesTable({ tokenId }: HoldersTradesTableProps) {
  const holders: Holder[] = [
    {
      id: "1",
      rank: 1,
      address: "FhVo...LuM",
      label: "Bonding Curve",
      percentage: "99.83%",
      solBalance: "1.75K",
      amount: "998M",
    },
    {
      id: "2",
      rank: 2,
      address: "87De...iDt",
      percentage: "0.17%",
      solBalance: "0.0206",
      amount: "1.67M",
    },
    {
      id: "3",
      rank: 3,
      address: "3Kp7...9Xm",
      percentage: "0.08%",
      solBalance: "0.0124",
      amount: "856K",
    },
    {
      id: "4",
      rank: 4,
      address: "9Lm2...4Qr",
      percentage: "0.05%",
      solBalance: "0.0089",
      amount: "523K",
    },
    {
      id: "5",
      rank: 5,
      address: "2Np6...8Zt",
      percentage: "0.03%",
      solBalance: "0.0056",
      amount: "312K",
    },
    {
      id: "6",
      rank: 6,
      address: "7Yn8...5Wk",
      percentage: "0.02%",
      solBalance: "0.0034",
      amount: "189K",
    },
    {
      id: "7",
      rank: 7,
      address: "4Zo9...1Hj",
      percentage: "0.01%",
      solBalance: "0.0021",
      amount: "124K",
    },
    {
      id: "8",
      rank: 8,
      address: "6Ap0...7Cv",
      percentage: "0.01%",
      solBalance: "0.0019",
      amount: "98K",
    },
  ];

  const trades: Trade[] = [
    {
      id: "1",
      age: "2s",
      type: "Buy",
      price: "$190.98",
      volume: "$20.00",
      sol: "0.105",
      trader: "AEC...vVr",
    },
    {
      id: "2",
      age: "2s",
      type: "Sell",
      price: "$190.99",
      volume: "$20.00",
      sol: "0.105",
      trader: "AEC...vVr",
    },
    {
      id: "3",
      age: "2s",
      type: "Sell",
      price: "$190.97",
      volume: "$58.47",
      sol: "0.306",
      trader: "Apt...hjA",
    },
    {
      id: "4",
      age: "2s",
      type: "Sell",
      price: "$190.98",
      volume: "$7.6393",
      sol: "0.0400",
      trader: "9fD...5ur",
    },
    {
      id: "5",
      age: "2s",
      type: "Sell",
      price: "$190.96",
      volume: "$408.17",
      sol: "2.14",
      trader: "3ZW...XbE",
    },
    {
      id: "6",
      age: "5s",
      type: "Buy",
      price: "$190.85",
      volume: "$15.50",
      sol: "0.081",
      trader: "7Km...9pQ",
    },
    {
      id: "7",
      age: "8s",
      type: "Buy",
      price: "$190.92",
      volume: "$42.30",
      sol: "0.221",
      trader: "5Nx...2Rt",
    },
    {
      id: "8",
      age: "12s",
      type: "Sell",
      price: "$190.88",
      volume: "$89.12",
      sol: "0.467",
      trader: "8Qr...4Lm",
    },
  ];

  return (
    <div className="w-full border-t uppercase">
      <Tabs defaultValue="holders" className="w-full">
        <div className="border-b flex items-center justify-between">
          <TabsList className="">
            <TabsTrigger value="holders">
              Top Holders({holders.length})
            </TabsTrigger>
            <TabsTrigger value="trades">
              Recent Trades({trades.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="holders" className="mt-0">
          <div className="overflow-x-auto">
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
                {holders.map((holder) => (
                  <tr
                    key={holder.id}
                    className="border-b hover:bg-accent/50 transition-colors"
                  >
                    <td className="p-3 text-muted-foreground">
                      #{holder.rank}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`https://solscan.io/account/${holder.address}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 hover:text-primary transition-colors font-mono"
                        >
                          {holder.address}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {holder.label && (
                          <Badge
                            variant="secondary"
                            className="rounded-none text-xs"
                          >
                            {holder.label}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center">
                        <div className="text-xs text-muted-foreground">
                          ${holder.percentage.replace("%", "")}
                        </div>
                        <div className="font-medium text-xs">
                          ({holder.percentage})
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {holder.solBalance}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {holder.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="trades" className="mt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-muted-foreground">
                  <th className="text-left p-3 font-medium">Date/Age</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">Volume</th>
                  <th className="text-right p-3 font-medium">SOL</th>
                  <th className="text-right p-3 font-medium">Trader</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className={`text-xs py-1 px-2 border-b rounded capitalize ${
                      trade.type === "Buy" ? "text-primary" : "text-[#F10D11]"
                    }`}
                  >
                    <td className="p-3">
                      <span className="lowercase">{trade.age}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs py-1 px-2 rounded capitalize ${
                          trade.type === "Buy"
                            ? "bg-primary/10 text-primary"
                            : "bg-[#F10D11]/10 text-[#F10D11]"
                        }`}
                      >
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {trade.price}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {trade.volume}
                    </td>
                    <td className="p-3 text-right font-medium">{trade.sol}</td>
                    <td className="p-3 text-right normal-case">
                      <Link
                        href={`https://solscan.io/account/${trade.trader}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <span className="font-mono">{trade.trader}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
