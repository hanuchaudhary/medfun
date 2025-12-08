"use client";

import React, { useEffect } from "react";
import { TokenCard } from "./token-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Token } from "@/types/token";
import { useTokenStore } from "@/store/tokenStore";

export function TokenGrid() {
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string>("recent-created");

  const { tokens, isLoadingTokens, fetchTokens } = useTokenStore();

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchTokens(true);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchTokens]);

  const filteredAndSorted = React.useMemo(() => {
    const list = (tokens ?? []).filter((t: Token) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const name = (t.name ?? "").toLowerCase();
      const symbol = (t.symbol ?? "").toLowerCase();
      const desc = (t.description ?? "").toLowerCase();
      const mint = (t.mintAddress ?? "").toLowerCase();
      return (
        name.includes(q) ||
        symbol.includes(q) ||
        desc.includes(q) ||
        mint.includes(q)
      );
    });

    const byNumber = (value: unknown): number => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const cleaned = value.replace(/[$,]/g, "").trim();
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : 0;
      }
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    const sorted = [...list];
    switch (sortBy) {
      case "recent-created":
        sorted.sort((a, b) => {
          const timeA = new Date(a.createdAt ?? 0).getTime();
          const timeB = new Date(b.createdAt ?? 0).getTime();
          return timeB - timeA;
        });
        break;
      case "name-asc":
        sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        break;
      case "name-desc":
        sorted.sort((a, b) => (b.name ?? "").localeCompare(a.name ?? ""));
        break;
      case "progress-desc":
        sorted.sort(
          (a, b) =>
            byNumber(b.bondingCurveProgress) - byNumber(a.bondingCurveProgress)
        );
        break;
      case "progress-asc":
        sorted.sort(
          (a, b) =>
            byNumber(a.bondingCurveProgress) - byNumber(b.bondingCurveProgress)
        );
        break;
      case "marketcap-desc":
        sorted.sort((a, b) => byNumber(b.marketCap) - byNumber(a.marketCap));
        break;
      case "marketcap-asc":
        sorted.sort((a, b) => byNumber(a.marketCap) - byNumber(b.marketCap));
        break;
      default:
        break;
    }
    return sorted;
  }, [tokens, search, sortBy]);

  return (
    <div className="flex flex-col">
      <div className="md:mb-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:border-b">
        <Input
          placeholder="Search by name, symbol, description, or mint..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md md:border-0 border-y rounded-none focus-visible:outline-0 dark:bg-background focus-visible:ring-0 py-8 text-xs sm:text-lg"
        />
        <div className="block md:hidden w-full h-4 pointer-events-none border-b bg-[image:repeating-linear-gradient(315deg,_#0000000d_0,_#0000000d_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed dark:bg-[image:repeating-linear-gradient(315deg,_#ffffff1a_0,_#ffffff0a_1px,_transparent_0,_transparent_50%)]" />
        <div className="md:flex hidden items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="border-0 rounded-none py-8">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent-created">Recently Created</SelectItem>
              <SelectItem value="name-asc">Name (A → Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z → A)</SelectItem>
              <SelectItem value="progress-desc">
                Progress (High → Low)
              </SelectItem>
              <SelectItem value="progress-asc">
                Progress (Low → High)
              </SelectItem>
              <SelectItem value="marketcap-desc">
                Market Cap (High → Low)
              </SelectItem>
              <SelectItem value="marketcap-asc">
                Market Cap (Low → High)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {isLoadingTokens && (
          <>
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="border rounded-none p-4 bg-card animate-pulse h-80"
              />
            ))}
          </>
        )}
        {!isLoadingTokens &&
          filteredAndSorted.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              href={`/tokens/${token.mintAddress}`}
            />
          ))}
        {!isLoadingTokens && filteredAndSorted.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No tokens found.
          </div>
        )}
      </div>
    </div>
  );
}
