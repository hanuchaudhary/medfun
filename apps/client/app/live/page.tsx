"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface Token {
  mintAddress: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  creatorAddress: string;
  marketCap?: number;
  volume?: number;
  isStreamLive: boolean;
}

export default function LivePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLiveTokens = async () => {
      try {
        const response = await fetch("/api/live/tokens");
        const data = await response.json();
        setTokens(data.tokens || []);
      } catch (error) {
        console.error("Error fetching live tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveTokens();

    const interval = setInterval(fetchLiveTokens, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTokenClick = (mintAddress: string) => {
    router.push(`/coins/${mintAddress}?live=true`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Live Streams</h1>
        <p className="text-muted-foreground">
          {tokens.length} {tokens.length === 1 ? "stream" : "streams"} currently
          live
        </p>
      </div>

      {tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-lg text-muted-foreground mb-2">
            No live streams right now
          </p>
          <p className="text-sm text-muted-foreground">
            Check back later or create your own!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokens.map((token) => (
            <div
              key={token.mintAddress}
              onClick={() => handleTokenClick(token.mintAddress)}
              className="cursor-pointer group relative overflow-hidden hover:border-primary transition-all"
            >
              <div className="absolute top-2 right-2 z-10">
                <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
              </div>

              <div className="aspect-video bg-muted relative overflow-hidden rounded-2xl">
                {token.imageUrl ? (
                  <Image
                    src={token.imageUrl}
                    alt={token.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>

              <div className="py-4">
                <h3 className="font-semibold text-lg truncate">
                  {token.name}
                </h3>
                <p className="text-sm text-primary">
                  ${token.symbol}
                </p>

                {token.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {token.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs">
                  {token.marketCap && (
                    <div>
                      <span className="text-muted-foreground">MCap: </span>
                      <span className="font-medium text-primary">
                        ${(token.marketCap / 1000).toFixed(1)}K
                      </span>
                    </div>
                  )}
                  {token.volume && (
                    <div>
                      <span className="text-muted-foreground">Vol: </span>
                      <span className="font-medium">
                        ${(token.volume / 1000).toFixed(1)}K
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
