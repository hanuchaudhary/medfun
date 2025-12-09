import { TokenGrid } from "@/components/coins/token-grid";
import { Suspense } from "react";

export default function TokensPage() {
  return (
    <div className="relative w-full px-6 py-4">
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
