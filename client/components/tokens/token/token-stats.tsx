"use client";

import { formatCount, formatNumber, formatPercentage } from "@/lib/utils";
import { useTokenStore } from "@/store/tokenStore";
import type { TokenStats as StatType } from "@/types/token";
import React from "react";

type TimeFrame = "5m" | "1h" | "6h" | "24h";

export default function TokenStats() {
  const { currentToken, isLoadingCurrentToken } = useTokenStore();
  const [selectedTimeFrame, setSelectedTimeFrame] =
    React.useState<TimeFrame>("24h");

  if (isLoadingCurrentToken) {
    return (
      <div className="w-full h-fit border-t uppercase p-2 animate-pulse">
        <div className="h-62 bg-muted"></div>
      </div>
    );
  }

  if (!currentToken) {
    return null;
  }

  const calculateBuySellPercentage = (stats: StatType | null) => {
    if (!stats || !stats.buyVolume || !stats.sellVolume) {
      return { buyPercent: 50, sellPercent: 50 };
    }
    const total = stats.buyVolume + stats.sellVolume;
    const buyPercent = (stats.buyVolume / total) * 100;
    const sellPercent = (stats.sellVolume / total) * 100;
    return { buyPercent, sellPercent };
  };

  const getStatsForTimeFrame = (timeFrame: TimeFrame): StatType | null => {
    switch (timeFrame) {
      case "5m":
        return currentToken.stats5m;
      case "1h":
        return currentToken.stats1h;
      case "6h":
        return currentToken.stats6h;
      case "24h":
        return currentToken.stats24h;
      default:
        return null;
    }
  };

  const timeFrames: { value: TimeFrame; label: string }[] = [
    { value: "5m", label: "5m" },
    { value: "1h", label: "1h" },
    { value: "6h", label: "6h" },
    { value: "24h", label: "24h" },
  ];

  const currentStats = getStatsForTimeFrame(selectedTimeFrame);
  const { buyPercent, sellPercent } = calculateBuySellPercentage(currentStats);
  const netVolume = currentStats
    ? (currentStats.buyVolume || 0) - (currentStats.sellVolume || 0)
    : 0;

  const volumeStats = [
    {
      label: `${selectedTimeFrame} Vol`,
      value: formatNumber(
        currentStats
          ? (currentStats.buyVolume || 0) + (currentStats.sellVolume || 0)
          : 0
      ),
    },
    {
      label: "Net Vol",
      value: formatNumber(netVolume),
    },
  ];

  const tradingStats = [
    {
      label: `${selectedTimeFrame} Traders`,
      value: formatCount(currentStats?.numTraders),
    },
    {
      label: "Net Buyers",
      value: formatCount(currentStats?.numNetBuyers),
    },
  ];

  const changeStats = [
    {
      label: "Vol %",
      value: currentStats?.volumeChange,
    },
    {
      label: "Liquidity %",
      value: currentStats?.liquidityChange,
    },
    {
      label: "Holders %",
      value: currentStats?.holderChange,
    },
  ];

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground my-4 px-4">
        Token Statistics
      </h4>
      <div className="grid grid-cols-4 mb-4 divide-x">
        {timeFrames.map((timeFrame) => {
          const stats = getStatsForTimeFrame(timeFrame.value);
          const isDisabled = !stats;
          const isActive = selectedTimeFrame === timeFrame.value;

          return (
            <button
              key={timeFrame.value}
              onClick={() =>
                !isDisabled && setSelectedTimeFrame(timeFrame.value)
              }
              disabled={isDisabled}
              className={`text-center p-2 border-y transition-all ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed bg-secondary/10"
                  : isActive
                  ? "bg-primary/5 border-primary/20 border-r"
                  : "bg-secondary/20 hover:bg-secondary/40 cursor-pointer"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {timeFrame.label}
              </div>
              <div
                className={`text-sm font-medium ${
                  isDisabled
                    ? "text-muted-foreground"
                    : (stats?.priceChange || 0) >= 0
                    ? "text-primary"
                    : "text-[#F23674]"
                }`}
              >
                {isDisabled ? "-" : formatPercentage(stats?.priceChange)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 px-4">
        {volumeStats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="font-medium">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 px-4">
        {tradingStats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="font-medium">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary">
              {buyPercent.toFixed(0)}% Buy
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#F23674]">
              {sellPercent.toFixed(0)}% Sell
            </span>
          </div>
        </div>
        <div className="h-3 bg-[#F23674]/20 overflow-hidden flex">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${buyPercent}%` }}
          />
          <div
            className="h-full bg-[#F23674] transition-all"
            style={{ width: `${sellPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x mb-4">
        {changeStats.map((stat) => (
          <div key={stat.label} className="text-center p-2 border-y">
            <div className="text-xs text-muted-foreground mb-1">
              {stat.label}
            </div>
            <div
              className={`text-sm font-medium ${
                (stat.value || 0) >= 0 ? "text-primary" : "text-[#F23674]"
              }`}
            >
              {formatPercentage(stat.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
