"use client";

import { useEffect, useRef, useState } from "react";
import { Kline } from "@/types/token";
import { cn } from "@/lib/utils";
import { ChartManager } from "@/lib/chart-manager";
import { useTokenStore } from "@/store/tokenStore";
import { ChevronRight } from "lucide-react";

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "1w", value: "1w" },
] as const;

const VISIBLE_COUNT = 3;

interface TokenChartProps {
  mintAddress: string;
  klines?: Kline[];
}

export function TokenChart({ mintAddress, klines }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const previousTimeframeRef = useRef<string | null>(null);
  const { currentTimeframe, setTimeframe } = useTokenStore();
  const [showAllTimeframes, setShowAllTimeframes] = useState(false);

  const visibleTimeframes = showAllTimeframes
    ? TIMEFRAMES
    : TIMEFRAMES.slice(0, VISIBLE_COUNT);

  useEffect(() => {
    const saved = localStorage.getItem("chart-timeframe");
    if (saved && saved !== currentTimeframe) {
      setTimeframe(saved);
    }
  }, []);

  const handleTimeframeChange = (tf: string) => {
    localStorage.setItem("chart-timeframe", tf);
    setTimeframe(tf);
  };

  useEffect(() => {
    if (!chartContainerRef.current || !klines || klines.length === 0) return;

    const chartData = klines.map((k) => ({
      timestamp: new Date(k.timestamp).getTime(),
      open: Number(k.open),
      high: Number(k.high),
      low: Number(k.low),
      close: Number(k.close),
      volume: Number(k.volume),
    }));

    const timeframeChanged =
      previousTimeframeRef.current !== null &&
      previousTimeframeRef.current !== currentTimeframe;

    if (!chartManagerRef.current || timeframeChanged) {
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
      }

      chartManagerRef.current = new ChartManager(
        chartContainerRef.current,
        chartData,
        { background: "transparent", color: "#e5e7eb" }
      );
    } else {
      chartManagerRef.current.setData(chartData);
    }

    previousTimeframeRef.current = currentTimeframe;
  }, [klines, currentTimeframe]);

  useEffect(() => {
    return () => {
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        chartManagerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-1 py-2 ml-24 relative z-10">
        {visibleTimeframes.map((tf) => (
          <button
            key={tf.value}
            type="button"
            onClick={() => handleTimeframeChange(tf.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
              currentTimeframe === tf.value
                ? "bg-primary text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tf.label}
          </button>
        ))}
        {TIMEFRAMES.length > VISIBLE_COUNT && (
          <button
            type="button"
            onClick={() => setShowAllTimeframes(!showAllTimeframes)}
            className={cn(
              "p-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
              "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            title={showAllTimeframes ? "Show less" : "Show more timeframes"}
          >
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                showAllTimeframes && "rotate-180"
              )}
            />
          </button>
        )}
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
