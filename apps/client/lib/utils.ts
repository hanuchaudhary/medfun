import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "$0";
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
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
