import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "$0";
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "$0";
  if (n >= 1000000) {
    return `$${(n / 1000000).toFixed(2)}M`;
  } else if (n >= 1000) {
    return `$${(n / 1000).toFixed(2)}K`;
  }
  return `$${n.toFixed(2)}`;
}

export function formatPercentage(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0%";
  return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
}

export function formatCount(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString();
}

export const formatAddress = (address: string) => {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const getTimeSince = (timestamp: string | Date) => {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};
