"use client";

import { useEffect, useRef } from "react";
import { Kline } from "@/types/token";
import { cn } from "@/lib/utils";
import { ChartManager } from "@/lib/chart-manager";
import { useTokenStore } from "@/store/tokenStore";

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "24h", value: "24h" },
  { label: "1w", value: "1w" },
] as const;

interface TokenChartProps {
  mintAddress: string;
  klines?: Kline[];
}

export function TokenChart({ mintAddress, klines }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const { currentTimeframe, setTimeframe } = useTokenStore();

  useEffect(() => {
    if (!chartContainerRef.current || !klines || klines.length === 0) return;

    if (chartManagerRef.current) {
      chartManagerRef.current.destroy();
    }

    const chartData = klines.map((k) => ({
      timestamp: new Date(k.timestamp).getTime(),
      open: Number(k.open),
      high: Number(k.high),
      low: Number(k.low),
      close: Number(k.close),
      volume: Number(k.volume),
    }));

    chartManagerRef.current = new ChartManager(
      chartContainerRef.current,
      chartData,
      { background: "transparent", color: "#e5e7eb" }
    );

    return () => {
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        chartManagerRef.current = null;
      }
    };
  }, [klines]);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-1 py-2 ml-24">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              currentTimeframe === tf.value
                ? "bg-primary text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div ref={chartContainerRef} className="w-full h-[450px] pb-8" />
      {(!klines || klines.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pt-10">
          <div className="text-muted-foreground">No chart data available</div>
        </div>
      )}
    </div>
  );
}
