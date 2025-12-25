import { TokenGrid } from "@/components/coins/token-grid";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Tokens",
  description:
    "Discover and trade the hottest tokens on Solana. Browse trending meme coins, new launches, and top performers on med.fun.",
  openGraph: {
    title: "Explore Tokens | med.fun",
    description:
      "Discover and trade the hottest tokens on Solana. Browse trending meme coins, new launches, and top performers.",
  },
};

export default function TokensPage() {
  return (
    <div className="relative w-full px-6 py-4 md:mb-0 mb-20">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="border rounded-lg p-0 bg-card animate-pulse h-80"
              />
            ))}
          </div>
        }
      >
        <TokenGrid />
      </Suspense>
    </div>
  );
}
