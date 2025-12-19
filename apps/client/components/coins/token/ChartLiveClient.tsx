"use client";

import React from "react";
import { useCurrentToken } from "./token-page-wrapper";
import { IconChartCandleFilled, IconVideoFilled } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TokenChart } from "./token-chart";
import LiveStreamComponent, {
  LiveStreamHandle,
} from "@/components/live/live-stream-component";
import { useWallet } from "@/hooks/use-wallet";
import { useTokenStore } from "@/store/tokenStore";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface ChartLiveClientProps {
  mintAddress: string;
}

export default function ChartLiveClient({ mintAddress }: ChartLiveClientProps) {
  const searchParams = useSearchParams();
  const shouldOpenLive = searchParams.get("live") === "true";

  const [mode, setMode] = React.useState<"LIVE" | "CHART">(
    shouldOpenLive ? "LIVE" : "CHART"
  );
  const [isStreamActive, setIsStreamActive] = React.useState(false);
  const [streamRole, setStreamRole] = React.useState<
    "host" | "audience" | null
  >(null);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingMode, setPendingMode] = React.useState<"LIVE" | "CHART" | null>(
    null
  );
  const [showNavigationDialog, setShowNavigationDialog] = React.useState(false);
  const [blockedHref, setBlockedHref] = React.useState<string | null>(null);
  const liveStreamRef = React.useRef<LiveStreamHandle>(null);
  const wallet = useWallet();
  const currentToken = useCurrentToken();
  const isLoadingCurrentToken = !currentToken;
  const { klines, isLoadingKlines, fetchKlines } = useTokenStore();

  React.useEffect(() => {
    fetchKlines(mintAddress);

    const interval = setInterval(() => {
      fetchKlines(mintAddress, "1m", true);
    }, 50000);

    return () => clearInterval(interval);
  }, [mintAddress, fetchKlines]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStreamActive && mode === "LIVE") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isStreamActive, mode]);

  React.useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      if (!isStreamActive || mode !== "LIVE") return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.href.includes(mintAddress)) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);

        if (url.pathname !== currentUrl.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setBlockedHref(link.href);
          setShowNavigationDialog(true);
        }
      }
    };

    document.addEventListener("click", handleLinkClick, true);
    return () => document.removeEventListener("click", handleLinkClick, true);
  }, [isStreamActive, mode, mintAddress]);

  const isCreator =
    wallet?.connected &&
    wallet?.publicKey?.toBase58() === currentToken?.creatorAddress;

  const handleStreamStateChange = (
    isActive: boolean,
    role: "host" | "audience" | null
  ) => {
    setIsStreamActive(isActive);
    setStreamRole(role);
  };

  const handleModeChange = async (newMode: "LIVE" | "CHART") => {
    if (mode === "LIVE" && isStreamActive) {
      if (streamRole === "host") {
        setPendingMode(newMode);
        setShowConfirmDialog(true);
        return;
      }

      if (liveStreamRef.current) {
        await liveStreamRef.current.leaveChannel();
      }
    }

    setMode(newMode);
  };

  const handleConfirmStopStream = async () => {
    if (liveStreamRef.current) {
      await liveStreamRef.current.leaveChannel();
    }

    if (pendingMode) {
      setMode(pendingMode);
    }

    setShowConfirmDialog(false);
    setPendingMode(null);
  };

  const handleCancelStopStream = () => {
    setShowConfirmDialog(false);
    setPendingMode(null);
  };

  const handleConfirmNavigation = async () => {
    if (liveStreamRef.current) {
      await liveStreamRef.current.leaveChannel();
    }
    setShowNavigationDialog(false);
    if (blockedHref) {
      window.location.href = blockedHref;
    }
  };

  const handleCancelNavigation = () => {
    setShowNavigationDialog(false);
    setBlockedHref(null);
  };

  if (!currentToken && mode === "CHART" && isLoadingCurrentToken) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="border divide-x divide-dashed border-dashed w-fit z-10 absolute top-0 left-0">
        <button
          className={`p-2 backdrop-blur-sm ${
            mode === "CHART" ? "bg-primary/20" : "bg-transparent"
          }`}
          onClick={() => handleModeChange("CHART")}
        >
          <IconChartCandleFilled
            className={mode === "CHART" ? "text-primary" : ""}
          />
        </button>
        <button
          className={`p-2 backdrop-blur-sm ${
            mode === "LIVE" ? "bg-primary/20" : "bg-transparent"
          }`}
          onClick={() => handleModeChange("LIVE")}
        >
          <IconVideoFilled className={mode === "LIVE" ? "text-primary" : ""} />
        </button>
      </div>
      {mode === "LIVE" ? (
        <LiveStreamComponent
          ref={liveStreamRef}
          isCreator={isCreator}
          channelId={mintAddress}
          onStreamStateChange={handleStreamStateChange}
        />
      ) : (
        <TokenChart mintAddress={mintAddress} klines={klines} />
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {streamRole === "host" ? "Stop Streaming?" : "Leave Stream?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {streamRole === "host" ? (
                <>
                  <p>Leaving this page will end the stream for all viewers.</p>
                  <p className="text-sm">
                    If you want to keep the stream running, please open other
                    pages in a new tab instead.
                  </p>
                </>
              ) : (
                <p>Are you sure you want to leave the stream?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelStopStream}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStopStream}>
              {streamRole === "host" ? "End Stream" : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showNavigationDialog}
        onOpenChange={setShowNavigationDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {streamRole === "host"
                ? "End Stream and Leave?"
                : "Leave Stream?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {streamRole === "host" ? (
                <>
                  <p>Navigating away will end the stream for all viewers.</p>
                  <p className="text-sm">
                    To keep the stream running, open links in a new tab instead
                    (right-click → Open in New Tab).
                  </p>
                </>
              ) : (
                <>
                  <p>You are currently watching a stream.</p>
                  <p className="text-sm">
                    Navigating away will disconnect you from the stream.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Stay on Stream
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              {streamRole === "host" ? "End Stream & Leave" : "Leave Stream"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
