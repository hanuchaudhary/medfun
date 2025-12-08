"use client";

import React, { useMemo } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BackButton from "@/components/BackButton";
import Pattern from "@/components/landing/pattern";
import { Token } from "@/types/token";
import { TokenCard } from "@/components/tokens/token-card";

export default function ProfilePage() {
  const { publicKey } = useWallet();
  const address = useMemo(
    () => publicKey?.toString(),
    [publicKey]
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [creatorTokens, setCreatorTokens] = React.useState<Token[]>();

  React.useEffect(() => {
    const fetchCreatorTokens = async () => {
      try {
        if (!address) return;
        setIsLoading(true);
        const res = await fetch(`/api/tokens/user/${address}`);
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
      <Pattern />
      <BackButton href="/tokens" />
      <div className="mb-6">
        <div className="flex items-center md:flex-row flex-col px-6 gap-4">
          <Avatar className="size-48 rounded-none border-r">
            <AvatarImage
              src={
                "https://i.pinimg.com/736x/63/47/e2/6347e2a6a61f9a5990ff1201673e5d42.jpg"
              }
              alt="avatar"
            />
            <AvatarFallback>USR</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-2xl font-bold md:block hidden">Your Profile</span>
            <span className="text-muted-foreground text-sm break-all md:py-0 py-4">
              {address}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="relative mb-4">
          <h2 className="text-sm font-medium absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
            Your Tokens
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
          {isLoading && (
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="border-0 rounded-none p-4 bg-card animate-pulse h-40 border-r"
                />
              ))}
            </div>
          )}
          {!isLoading &&
            creatorTokens?.map((t) => (
              <TokenCard
                key={t.id}
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
