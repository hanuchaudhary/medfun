"use client";

import React from "react";
import { useCurrentToken } from "../token-page-wrapper";
import {
  IconCamera,
  IconChartCandleFilled,
  IconVideoFilled,
} from "@tabler/icons-react";
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
import { TokenChart } from "../token-chart";
import { Kline } from "@/types/token";
import { supabaseClient } from "@/lib/supabaseClient";
import LiveStreamComponent, {
  LiveStreamHandle,
} from "@/components/live/live-stream-component";
import { useWallet } from "@/hooks/use-wallet";
import { subscribeToTableChanges } from "@/lib/realtime";

interface ChartLiveClientProps {
  mintAddress: string;
  klines: Kline[];
}

export default function ChartLiveClient({
  mintAddress,
  klines: initialKlines,
}: ChartLiveClientProps) {
  const [mode, setMode] = React.useState<"LIVE" | "CHART">("CHART");
  const [isStreamActive, setIsStreamActive] = React.useState(false);
  const [streamRole, setStreamRole] = React.useState<
    "host" | "audience" | null
  >(null);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingMode, setPendingMode] = React.useState<"LIVE" | "CHART" | null>(
    null
  );
  const liveStreamRef = React.useRef<LiveStreamHandle>(null);
  const wallet = useWallet();
  const currentToken = useCurrentToken();
  const isLoadingCurrentToken = !currentToken;
  const [klines, setKlines] = React.useState<Kline[]>(initialKlines);

  React.useEffect(() => {
    const channel = subscribeToTableChanges({
      table: "kline",
      mintAddress,
      callback: (payload: any) => {
        console.log("KLINE CHANGE:", payload);
        if (payload.eventType === "INSERT") {
          setKlines((prev) => [...prev, payload.new as Kline]);
        } else if (payload.eventType === "UPDATE") {
          setKlines((prev) => {
            const updatedKline = payload.new as Kline;
            return prev.map((kline) =>
              kline.id === updatedKline.id ? updatedKline : kline
            );
          });
        }
      },
    });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [mintAddress]);

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

  if (!currentToken && mode === "CHART" && isLoadingCurrentToken) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="border divide-x w-fit z-10 absolute top-0 left-0">
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
            <AlertDialogTitle>Stop Streaming?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop streaming? This will end the stream
              for all viewers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelStopStream}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStopStream}>
              Stop Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
