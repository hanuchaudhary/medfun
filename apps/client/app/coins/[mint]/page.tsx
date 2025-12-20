import { TokenDetails } from "@/components/coins/token/token-details";
import SwapContainer from "@/components/coins/swap/swap-container";
import { HoldersTradesTable } from "@/components/coins/token/holders-trades-table";
import { TokenInfoCard } from "@/components/coins/token/token-info-card";
import { MobileSwapModal } from "@/components/coins/swap/mobile-swap-modal";
import { TokenPageWrapper } from "@/components/coins/token/token-page-wrapper";
import TokenStats from "@/components/coins/token/token-stats";
import { ChartLiveWrapper } from "@/components/live/chart-live-wrapper";
import { RecentlyOpened } from "@/components/coins/token/recently-opened";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default async function TokenDetailPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  return (
    <TokenPageWrapper tokenMint={mint}>
      <div className="relative border-t border-dashed h-[calc(100vh-88px)] pb-10">
        <div className="lg:hidden pb-24">
          <div className="border-b">
            <TokenDetails tokenMint={mint} />
          </div>
          <div className="relative">
            <div className="border-b relative">
              <ChartLiveWrapper mintAddress={mint} />
            </div>
            <div className="border-b">
              <HoldersTradesTable mintAddress={mint} />
            </div>
            <div className="border-b">
              <TokenInfoCard />
            </div>
          </div>
        </div>
        <div className="hidden lg:grid lg:grid-cols-4 divide-x divide-dashed">
          <div className="flex col-span-1 flex-col overflow-auto hide-scrollbar">
            <TokenDetails tokenMint={mint} />
            <TokenStats />
          </div>
          <div className="col-span-2 flex flex-col overflow-hidden relative divide-y h-full divide-dashed">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="overflow-auto hide-scrollbar">
                  <ChartLiveWrapper mintAddress={mint} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="overflow-auto hide-scrollbar h-full">
                  <HoldersTradesTable mintAddress={mint} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <div className="col-span-1 overflow-auto relative hide-scrollbar divide-y h-full divide-dashed">
            <SwapContainer mint={mint} />
            <TokenInfoCard />
          </div>
        </div>
        <MobileSwapModal tokenId={mint} />
        <RecentlyOpened currentTokenId={mint} />
      </div>
    </TokenPageWrapper>
  );
}
