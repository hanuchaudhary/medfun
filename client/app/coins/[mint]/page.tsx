import { TokenDetails } from "@/components/coins/token/token-details";
import SwapContainer from "@/components/coins/swap/swap-container";
import { TokenChart } from "@/components/coins/token/token-chart";
import { HoldersTradesTable } from "@/components/coins/token/holders-trades-table";
import { TokenInfoCard } from "@/components/coins/token/token-info-card";
import { MobileSwapModal } from "@/components/coins/swap/mobile-swap-modal";
import { RecentlyOpened } from "@/components/coins/token/recently-opened";
import { TokenPageWrapper } from "@/components/coins/token/token-page-wrapper";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
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
      <RecentlyOpened currentTokenId={mint} />
      <div className="relative  ">
        <div className="lg:hidden pb-24">
          <div className="border-b">
            <TokenDetails tokenMint={mint} />
          </div>
          <div className="relative">
            {/* <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <span className="text-white text-2xl font-semibold mb-4">
                COMING SOON
              </span>
              <a
                className="px-8 py-6 bg-primary text-background font-medium"
                href={"https://jup.ag/coins/" + mint}
                target="_blank"
                rel="noopener noreferrer"
              >
                Trade on Jupiter
              </a>
            </div> */}
            <div className="border-b relative">
              <TokenChart mintAddress={mint} />
            </div>
            <div className="border-b">
              <HoldersTradesTable tokenId={mint} />
            </div>
            <div className="border-b">
              <TokenInfoCard />
            </div>
          </div>
        </div>
        <div className="hidden lg:grid lg:grid-cols-4 lg:divide-x h-[calc(100vh-7.5rem)] overflow-hidden">
          <div className="flex col-span-1 flex-col border-l border-t overflow-auto hide-scrollbar">
            <TokenDetails tokenMint={mint} />
            <TokenInfoCard />
          </div>
          <div className="col-span-2 flex flex-col overflow-hidden relative">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={65} minSize={30}>
                <div className="h-full overflow-auto hide-scrollbar">
                  {/* <TokenChart mintAddress={mint} /> */}
                  <ChartLiveWrapper mintAddress={mint} />
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={35} minSize={30}>
                <div className="h-full overflow-auto hide-scrollbar">
                  <HoldersTradesTable tokenId={mint} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
            {/* <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <span className="text-white text-2xl font-semibold mb-4">
                COMING SOON
              </span>
              <a
                className="px-8 py-6 bg-primary text-background font-medium"
                href={"https://jup.ag/coins/" + mint}
                target="_blank"
                rel="noopener noreferrer"
              >
                Trade on Jupiter
              </a>
            </div> */}
          </div>
          <div className="col-span-1 overflow-auto relative hide-scrollbar">
            <SwapContainer mint={mint} />
            <TokenStats />
            {/* <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10"></div> */}
          </div>
        </div>
        {/* <MobileSwapModal tokenName={"tokenName"} tokenId={mint} /> */}
      </div>
    </TokenPageWrapper>
  );
}
