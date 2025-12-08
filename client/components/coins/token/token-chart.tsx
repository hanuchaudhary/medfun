"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  UTCTimestamp,
  CrosshairMode,
  CandlestickSeries,
} from "lightweight-charts";
import { useTheme } from "next-themes";

interface TokenChartProps {
  mintAddress: string;
}

export function TokenChart({ mintAddress }: TokenChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      width: chartContainerRef.current.clientWidth,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9CA3AF",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
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

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: theme === "dark" ? "#6bbd6f" : "#0ea5e9",
      downColor: "#F10D11",
      borderUpColor: theme === "dark" ? "#6bbd6f" : "#0ea5e9",
      borderDownColor: "#F10D11",
      wickUpColor: theme === "dark" ? "#6bbd6f" : "#0ea5e9",
      wickDownColor: "#F10D11",
    });

    const generateMockData = () => {
      const data = [];
      const now = Math.floor(Date.now() / 1000);
      let basePrice = 0.0025;

      for (let i = 200; i >= 0; i--) {
        const timestamp = (now - i * 3600) as UTCTimestamp;
        const open = basePrice + (Math.random() - 0.5) * 0.0002;
        const close = open + (Math.random() - 0.5) * 0.0003;
        const high = Math.max(open, close) + Math.random() * 0.0001;
        const low = Math.min(open, close) - Math.random() * 0.0001;

        data.push({
          time: timestamp,
          open,
          high,
          low,
          close,
        });

        basePrice = close;
      }

      return data;
    };

    candlestickSeries.setData(generateMockData());
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
  }, [mintAddress]);

  return (
    <div className="w-full">
      <div ref={chartContainerRef} className="w-full rounded-xl pb-8" />
    </div>
  );
}
