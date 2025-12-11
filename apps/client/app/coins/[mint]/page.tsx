import { TokenDetails } from "@/components/coins/token/token-details";
import SwapContainer from "@/components/coins/swap/swap-container";
import { TokenChart } from "@/components/coins/token/token-chart";
import { HoldersTradesTable } from "@/components/coins/token/holders-trades-table";
import { TokenInfoCard } from "@/components/coins/token/token-info-card";
import { MobileSwapModal } from "@/components/coins/swap/mobile-swap-modal";
import { TokenPageWrapper } from "@/components/coins/token/token-page-wrapper";
import TokenStats from "@/components/coins/token/token-stats";
import { ChartLiveWrapper } from "@/components/live/chart-live-wrapper";

export default async function TokenDetailPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  return (
    <TokenPageWrapper tokenMint={mint}>
      <div className="relative p-4">
        <div className="lg:hidden pb-24">
          <div className="border-b">
            <TokenDetails tokenMint={mint} />
          </div>
          <div className="relative">
            <div className="border-b relative">
              <TokenChart mintAddress={mint} />
            </div>
            <div className="border-b">
              <HoldersTradesTable/>
            </div>
            <div className="border-b">
              <TokenInfoCard />
            </div>
          </div>
        </div>
        <div className="hidden lg:grid lg:grid-cols-4 gap-4">
          <div className="flex col-span-1 flex-col overflow-auto hide-scrollbar">
            <TokenDetails tokenMint={mint} />
            <TokenStats />
          </div>
          <div className="col-span-2 flex flex-col overflow-hidden relative space-y-4">
            <div className="overflow-auto hide-scrollbar border rounded-xl">
              <ChartLiveWrapper mintAddress={mint} />
            </div>
            <div className="overflow-auto border rounded-xl hide-scrollbar">
              <HoldersTradesTable />
            </div>
          </div>
          <div className="col-span-1 overflow-auto relative hide-scrollbar space-y-4">
            <SwapContainer mint={mint} />
            <TokenInfoCard />
          </div>
        </div>
        <MobileSwapModal tokenName={"tokenName"} tokenId={mint} />
        {/* <RecentlyOpened currentTokenId={mint} /> */}
      </div>
    </TokenPageWrapper>
  );
}
