"use client";

import React, { useMemo } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Token } from "@/types/token";
import { TokenCard } from "@/components/coins/token-card";

export default function ProfilePage() {
  const { publicKey } = useWallet();
  const address = useMemo(() => publicKey?.toString(), [publicKey]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [creatorTokens, setCreatorTokens] = React.useState<Token[]>();

  React.useEffect(() => {
    const fetchCreatorTokens = async () => {
      try {
        if (!address) return;
        setIsLoading(true);
        const res = await fetch(`/api/coins/user/${address}`);
        const data = await res.json();
        if (data.success) {
          setCreatorTokens(data.tokens);
        }
      } catch (error) {
        console.error("Error fetching creator tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreatorTokens();
  }, [address]);

  return (
    <div className="relative w-full px-6 py-4">
      <div className="mt-8">
        <div className="relative mb-4">
          <h2 className="font-semibold">
            Your Tokens
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {isLoading && (
            <div className="col-span-full grid grid-cols-1 gap-6 sm:grid-cols-2 rounded-xl lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="border-0 rounded-xl p-4 bg-card animate-pulse h-40"
                />
              ))}
            </div>
          )}
          {!isLoading &&
            creatorTokens?.map((t) => (
              <TokenCard
                key={t.mintAddress}
                token={t}
                href={`/profile/${t.mintAddress}`}
              />
            ))}
          {creatorTokens?.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No tokens found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
