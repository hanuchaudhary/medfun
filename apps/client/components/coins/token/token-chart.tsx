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
import { Kline } from "@/types/token";

interface TokenChartProps {
  mintAddress: string;
  klines?: Kline[];
}

export function TokenChart({ mintAddress, klines }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#e5e7eb",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
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

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#30b561",
      wickUpColor: "#22c55e",
      borderUpColor: "#22c55e",
      downColor: "#ef4444",
      wickDownColor: "#ef4444",
      borderDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    if (klines && klines.length > 0) {
      const candleData = klines.map((k) => ({
        time: Math.floor(
          new Date(k.timestamp).getTime() / 1000
        ) as UTCTimestamp,
        open: Number(k.open),
        high: Number(k.high),
        low: Number(k.low),
        close: Number(k.close),
      }));

      candleSeries.setData(candleData);

      const volumeData = klines.map((k) => ({
        time: Math.floor(
          new Date(k.timestamp).getTime() / 1000
        ) as UTCTimestamp,
        value: Number(k.volume),
        color: Number(k.close) >= Number(k.open) ? "#22c55e" : "#ef4444",
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
  }, [klines]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full pb-8" />
      {klines?.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">No chart data available</div>
        </div>
      )}
    </div>
  );
}
