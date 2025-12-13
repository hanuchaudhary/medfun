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
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTokensPolling } from "@/hooks/use-token-polling";

export function TokenGrid() {
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string>("recent-created");
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view") || "grid";

  const { tokens, isLoading: isLoadingTokens } = useTokensPolling();

  const toggleView = (newView: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", newView);
    router.push(`?${params.toString()}`);
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return "-";
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

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
    <div className="flex flex-col space-y-6">
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
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleView("table")}
              className="rounded-none h-9 px-3"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleView("grid")}
              className="rounded-none h-9 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Filter
          </span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="border-0 min-w-[180px]">
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

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                href={`/coins/${token.mintAddress}`}
              />
            ))}
          {!isLoadingTokens && filteredAndSorted.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No tokens found.
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary rounded-t-2xl overflow-hidden">
              <TableRow className="bg-secondary rounded-t-2xl overflow-hidden">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Coin</TableHead>
                <TableHead>Graph</TableHead>
                <TableHead className="text-right">MCAP</TableHead>
                <TableHead className="text-right">24H Vol</TableHead>
                <TableHead className="text-right">Age</TableHead>
                <TableHead className="text-right">Traders</TableHead>
                <TableHead className="text-right">5M</TableHead>
                <TableHead className="text-right">1H</TableHead>
                <TableHead className="text-right">6H</TableHead>
                <TableHead className="text-right">24H</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTokens && (
                <>
                  {[...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={11}>
                        <div className="h-12 bg-muted/50 animate-pulse rounded" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              {!isLoadingTokens &&
                filteredAndSorted.map((token, index) => (
                  <TableRow key={token.id} className="py-0">
                    <TableCell className="text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/coins/${token.mintAddress}`}
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            unoptimized
                            src={
                              token.imageUrl ||
                              "https://i.pinimg.com/1200x/b7/8f/02/b78f023aa1bca7bdada28db1c30d1fe5.jpg"
                            }
                            alt={token.name || "Token"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate uppercase">
                            {token.name || "-"}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase">
                            {token.symbol || "-"}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="w-24 h-10 bg-muted/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                        Chart
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(token.marketCap)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {token.createdAt ? formatTimeAgo(token.createdAt) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoadingTokens && filteredAndSorted.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center text-muted-foreground py-10"
                  >
                    No tokens found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
