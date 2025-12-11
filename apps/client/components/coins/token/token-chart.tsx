"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { useTokenStore } from "@/store/tokenStore";

interface TokenChartProps {
  mintAddress: string;
}

export function TokenChart({ mintAddress }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { klines, fetchKlines, isLoadingKlines } = useTokenStore();
  const [interval, setInterval] = useState("1_HOUR");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? "#e5e7eb" : "#111827",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#1f2937" : "#e5e7eb" },
        horzLines: { color: theme === "dark" ? "#1f2937" : "#e5e7eb" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries,({
      upColor: "#30b561",
      wickUpColor: "#22c55e",
      borderUpColor: "#22c55e",
      downColor: "#ef4444",       
      wickDownColor: "#ef4444",
      borderDownColor: "#ef4444",
    }));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    if (klines && klines.length > 0) {
      const candleData = klines.map((k) => ({
        time: Math.floor(new Date(k.timestamp).getTime() / 1000) as UTCTimestamp,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));

      candleSeries.setData(candleData);

      const volumeData = klines.map((k) => ({
        time: Math.floor(new Date(k.timestamp).getTime() / 1000) as UTCTimestamp,
        value: k.volume,
        color: k.close >= k.open ? "#22c55e" : "#ef4444",
      }));

      volumeSeries.setData(volumeData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [klines, theme]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full rounded-xl pb-8" />
      {isLoadingKlines && klines.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      )}
    </div>
  );
}
