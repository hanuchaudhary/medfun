"use client";

import React, { useEffect } from "react";
import { TokenCard } from "./token-card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTokenStore } from "@/store/tokenStore";

interface TrendingTokensProps {
  limit?: number;
  showViewAllButton?: boolean;
}

export function TrendingTokens({
  limit = 3,
  showViewAllButton = true,
}: TrendingTokensProps) {
  const router = useRouter();
  const { trendingTokens, isLoadingTrendingTokens, fetchTrendingTokens } = useTokenStore();

  useEffect(() => {
    fetchTrendingTokens(limit);
  }, [limit, fetchTrendingTokens]);

  return (
    <div className="flex flex-col">
      <div className="border-b">
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center border-b relative flex items-center justify-center"
        >
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-t bg-[image:repeating-linear-gradient(315deg,_#0000000d_0,_#0000000d_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed dark:border-x-[#ffffff1a] dark:bg-[image:repeating-linear-gradient(315deg,_#ffffff1a_0,_#ffffff0a_1px,_transparent_0,_transparent_50%)]" />
          <p className="text-xs font-medium text-muted-foreground py-3 px-8 w-fit">
            Trending Tokens
          </p>
          </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoadingTrendingTokens && (
          <>
            {[...Array(limit)].map((_, i) => (
              <div
                key={i}
                className="border rounded-none p-4 bg-card animate-pulse h-80"
              />
            ))}
          </>
        )}
        {!isLoadingTrendingTokens &&
          trendingTokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              href={`/tokens/${token.mintAddress}`}
            />
          ))}
        {!isLoadingTrendingTokens && trendingTokens.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No trending tokens found.
          </div>
        )}
      </div>

      {showViewAllButton && !isLoadingTrendingTokens && trendingTokens.length > 0 && (
        <div className="border-t p-4 flex justify-center">
          <Button
            variant="default"
            onClick={() => router.push("/tokens")}
            className="w-full sm:w-auto rounded-none py-8"
          >
            View All Tokens
          </Button>
        </div>
      )}
    </div>
  );
}
