"use client";

import { useCurrentToken } from "./token-page-wrapper";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import {
  IconBrandTelegram,
  IconBrandX,
  IconBrowser,
  IconGlobe,
  IconWorld,
} from "@tabler/icons-react";
import Link from "next/link";

export function TokenInfoCard() {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };
  const currentToken = useCurrentToken();

  if (!currentToken) {
    return (
      <div className="w-full h-fit border-t   p-2 animate-pulse">
        <div className="h-62 bg-muted"></div>
      </div>
    );
  }

  if (!currentToken) {
    return null;
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return "$0";
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="w-full h-fit p-4 mb-16">
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">
            Description
          </h4>
          <p className="text-sm normal-case leading-relaxed">
            {currentToken.description || "No description available"}
          </p>
        </div>

        <div className="my-5">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Socials
          </h4>
          <div className="flex flex-wrap gap-2">
            {currentToken.website && (
              <Link
                href={currentToken.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                <IconWorld className="size-5" />
              </Link>
            )}
            {currentToken.telegram && (
              <Link
                href={currentToken.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                <IconBrandTelegram className="size-5" />
              </Link>
            )}
            {currentToken.twitter && (
              <Link
                href={currentToken.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                <IconBrandX className="size-5" />
              </Link>
            )}
          </div>
        </div>

        <div >
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            Token Information
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Market Cap:</span>
              <span className="font-semibold font-mono">
                {formatNumber(currentToken.marketCap)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-semibold font-mono">
                {formatNumber(currentToken.volume)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Liquidity:</span>
              <span className="font-semibold font-mono">
                {formatNumber(currentToken.liquidity)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Holders:</span>
              <span className="font-semibold font-mono">
                {currentToken.holderCount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-semibold font-mono">
                {currentToken.bondingCurveProgress?.toFixed(2) ?? 0}%
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col text-sm group">
              <span className="text-muted-foreground mb-1">Mint Address:</span>
              <div
                onClick={() =>
                  copyToClipboard(currentToken.mintAddress, "Mint address")
                }
                className="font-mono text-xs break-all normal-case cursor-pointer hover:bg-secondary/50 transition-colors flex items-start gap-2 group hover:text-primary"
              >
                <span className="flex-1">{currentToken.mintAddress}</span>
                <Copy className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-primary" />
              </div>
            </div>
            <div className="flex flex-col text-sm group">
              <span className="text-muted-foreground mb-1">Pool Address:</span>
              <div
                onClick={() =>
                  copyToClipboard(currentToken.poolAddress, "Pool address")
                }
                className="font-mono text-xs break-all normal-case cursor-pointer hover:bg-secondary/50 transition-colors flex items-start gap-2 group hover:text-primary"
              >
                <span className="flex-1">{currentToken.poolAddress}</span>
                <Copy className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-primary" />
              </div>
            </div>
            <div className="flex flex-col text-sm group">
              <span className="text-muted-foreground mb-1">Creator:</span>
              <div
                onClick={() =>
                  copyToClipboard(
                    currentToken.creatorAddress,
                    "Creator address"
                  )
                }
                className="font-mono text-xs break-all normal-case cursor-pointer hover:bg-secondary/50 transition-colors flex items-start gap-2 group hover:text-primary"
              >
                <span className="flex-1">{currentToken.creatorAddress}</span>
                <Copy className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
