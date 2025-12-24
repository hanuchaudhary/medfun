"use client";

import React, { useRef, useEffect } from "react";

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  lineColor?: string;
  fillColor?: string;
  isPositive?: boolean;
}

export function MiniChart({
  data,
  width = 96,
  height = 40,
  lineColor,
  fillColor,
  isPositive = true,
}: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const paddingY = 4;
    const chartHeight = height - paddingY * 2;

    const points: { x: number; y: number }[] = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: paddingY + chartHeight - ((value - min) / range) * chartHeight,
    }));

    if (points.length < 2) return;

    const firstPoint = points[0]!;
    const lastPoint = points[points.length - 1]!;

    const defaultLineColor = isPositive ? "#22c55e" : "#ef4444";
    const defaultFillColor = isPositive
      ? "rgba(34, 197, 94, 0.1)"
      : "rgba(239, 68, 68, 0.1)";

    const strokeColor = lineColor || defaultLineColor;
    const areaFill = fillColor || defaultFillColor;

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, height);
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(lastPoint.x, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, areaFill);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      const cpX = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cpX, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(lastPoint.x, lastPoint.y);

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }, [data, width, height, lineColor, fillColor, isPositive]);

  if (data.length < 2) {
    return (
      <div
        className="bg-muted/30 rounded flex items-center justify-center text-xs text-muted-foreground"
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded"
      style={{ width, height }}
    />
  );
}


export function generateChartData(token: {
  stats5m?: { buyVolume?: number | null; sellVolume?: number | null } | null;
  stats1h?: { buyVolume?: number | null; sellVolume?: number | null } | null;
  stats6h?: { buyVolume?: number | null; sellVolume?: number | null } | null;
  stats24h?: { buyVolume?: number | null; sellVolume?: number | null } | null;
  bondingCurveProgress?: number | null;
}): number[] {
  const baseValue = 100;
  const points: number[] = [];
  
  const stats24h = token.stats24h;
  const stats6h = token.stats6h;
  const stats1h = token.stats1h;
  const stats5m = token.stats5m;

  const getNetFlow = (stats: typeof stats24h) => {
    if (!stats) return 0;
    const buy = stats.buyVolume ?? 0;
    const sell = stats.sellVolume ?? 0;
    return buy - sell;
  };

  const trend24h = getNetFlow(stats24h);
  const trend6h = getNetFlow(stats6h);
  const trend1h = getNetFlow(stats1h);
  const trend5m = getNetFlow(stats5m);

  let value = baseValue;
  const volatility = 0.05;

  for (let i = 0; i < 12; i++) {
    const progress = i / 11;
    let trendInfluence = 0;
    
    if (progress < 0.25) {
      trendInfluence = trend24h > 0 ? 0.02 : -0.02;
    } else if (progress < 0.5) {
      trendInfluence = trend6h > 0 ? 0.03 : -0.03;
    } else if (progress < 0.75) {
      trendInfluence = trend1h > 0 ? 0.04 : -0.04;
    } else {
      trendInfluence = trend5m > 0 ? 0.05 : -0.05;
    }

    const random = (Math.random() - 0.5) * volatility;
    value = value * (1 + trendInfluence + random);
    points.push(value);
  }

  if (!stats24h && !stats6h && !stats1h && !stats5m) {
    const progress = token.bondingCurveProgress ?? 0;
    const seed = progress * 1000;
    
    for (let i = 0; i < 12; i++) {
      const pseudoRandom = Math.sin(seed + i * 0.5) * 0.5 + 0.5;
      points[i] = baseValue * (0.9 + pseudoRandom * 0.2 + (progress / 100) * 0.3);
    }
  }

  return points;
}
