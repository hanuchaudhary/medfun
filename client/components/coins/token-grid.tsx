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
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, symbol, description, or mint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg text-sm h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Sort by
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="rounded-lg min-w-[180px]">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoadingTokens && (
          <>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-0 bg-card animate-pulse h-80"
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
