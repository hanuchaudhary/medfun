"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  UTCTimestamp,
  CrosshairMode,
  HistogramSeries,
} from "lightweight-charts";
import { useTheme } from "next-themes";
import { useTokenStore } from "@/store/tokenStore";
import { Button } from "@/components/ui/button";

interface TokenChartProps {
  mintAddress: string;
}

export function TokenChart({ mintAddress }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { klines, isLoadingKlines, fetchKlines } = useTokenStore();
  const [interval, setInterval] = useState("1_HOUR");

  useEffect(() => {
    if (mintAddress && interval) {
      fetchKlines(mintAddress, interval);
    }
  }, [interval]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      width: chartContainerRef.current.clientWidth,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? "#9CA3AF" : "#6B7280",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#1F2937" : "#E5E7EB" },
        horzLines: { color: theme === "dark" ? "#1F2937" : "#E5E7EB" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: "rgba(224, 224, 224, 0.3)",
          style: 2,
        },
        horzLine: {
          width: 1,
          color: "rgba(224, 224, 224, 0.3)",
          style: 2,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: theme === "dark" ? "#6bbd6f" : "#0ea5e9",
      priceFormat: {
        type: "volume",
      },
    });

    if (klines && klines.length > 0) {
      const chartData = klines.map((kline) => ({
        time: Math.floor(new Date(kline.time).getTime() / 1000) as UTCTimestamp,
        value: kline.netVolume,
        color:
          kline.netVolume >= 0
            ? theme === "dark"
              ? "#6bbd6f"
              : "#0ea5e9"
            : "#F10D11",
      }));

      histogramSeries.setData(chartData);
    }

    chart.timeScale().fitContent();
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [klines, theme]);

  const intervals = [
    { label: "5M", value: "5_MINUTE" },
    { label: "15M", value: "15_MINUTE" },
    { label: "1H", value: "1_HOUR" },
    { label: "4H", value: "4_HOUR" },
    { label: "1D", value: "1_DAY" },
  ];

  return (
    <div className="w-full">
      <div className="flex gap-2 p-3 border-b">
        {intervals.map((int) => (
          <Button
            key={int.value}
            variant={interval === int.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setInterval(int.value)}
            className="text-xs"
          >
            {int.label}
          </Button>
        ))}
      </div>
      <div ref={chartContainerRef} className="w-full rounded-xl pb-8" />
      {isLoadingKlines && klines.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      )}
    </div>
  );
}
