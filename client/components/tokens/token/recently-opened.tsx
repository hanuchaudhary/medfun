"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentToken {
  id: string;
  name: string;
  symbol: string;
  image: string;
  price: string;
  timestamp: number;
}

const STORAGE_KEY = "recently_opened_tokens";
const MAX_RECENT_TOKENS = 10;

export function RecentlyOpened({
  currentTokenId,
}: {
  currentTokenId?: string;
}) {
  const [recentTokens, setRecentTokens] = React.useState<RecentToken[]>([]);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const loadTokens = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const tokens = JSON.parse(stored);
        setRecentTokens(tokens);
      } catch (error) {
        console.error("Failed to parse recent tokens:", error);
      }
    }
  };

  React.useEffect(() => {
    loadTokens();
    const handleStorageChange = () => {
      loadTokens();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const removeToken = (tokenId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (tokenId === currentTokenId) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const tokens: RecentToken[] = JSON.parse(stored);
        const updatedTokens = tokens.filter((t) => t.id !== tokenId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTokens));
        setRecentTokens(updatedTokens);
        window.dispatchEvent(new Event("storage"));
      } catch (error) {
        console.error("Failed to remove token:", error);
      }
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (recentTokens.length === 0) return null;

  return (
    <div className="bg-background border-x border-b">
      <div className="flex items-center gap-2 px-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto hide-scrollbar"
        >
          <div className="flex divide-x">
            {recentTokens.map((token) => (
              <div key={token.id} className="relative group flex-shrink-0">
                <Link
                  href={`/tokens/${token.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 flex-shrink-0 hover:bg-accent transition-colors ${
                    currentTokenId === token.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <Image
                      unoptimized
                      src={token.image}
                      alt={token.name}
                      fill
                      className="object-cover rounded-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium uppercase">
                      {token.symbol}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {token.price}
                    </span>
                  </div>
                </Link>
                {currentTokenId !== token.id && (
                  <button
                    onClick={(e) => removeToken(token.id, e)}
                    className="absolute top-0 right-0 h-full w-9 bg-background border-l items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex cursor-pointer hover:text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function addRecentToken(token: Omit<RecentToken, "timestamp">) {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(STORAGE_KEY);
  let tokens: RecentToken[] = [];

  if (stored) {
    try {
      tokens = JSON.parse(stored);
    } catch (error) {
      console.error("Failed to parse recent tokens:", error);
    }
  }

  const existingIndex = tokens.findIndex((t) => t.id === token.id);
  if (existingIndex !== -1) {
    tokens.splice(existingIndex, 1);
  }

  tokens.unshift({ ...token, timestamp: Date.now() });

  if (tokens.length > MAX_RECENT_TOKENS) {
    tokens = tokens.slice(0, MAX_RECENT_TOKENS);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));

  window.dispatchEvent(new Event("storage"));
}
