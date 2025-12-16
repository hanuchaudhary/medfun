"use client";

import { useWallet } from "@/hooks/use-wallet";
import { useBalance } from "@/hooks/use-balance";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, LogOut, Download } from "lucide-react";
import { toast } from "sonner";
import React from "react";
import Image from "next/image";
import { usePrivy, type WalletWithMetadata } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  disconnect: () => void;
}

export default function WalletModal({
  open,
  onClose,
  disconnect,
}: WalletModalProps) {
  const { publicKey, wallet } = useWallet();
  const { balance: solanaBalance, isLoading: loadingBalance } = useBalance({
    publicKey,
    refetchInterval: 30000,
  });

  const { ready, authenticated, user } = usePrivy();
  const { exportWallet } = useExportWallet();

  const isAuthenticated = ready && authenticated;
  const hasEmbeddedWallet = !!user?.linkedAccounts.find(
    (account): account is WalletWithMetadata =>
      account.type === "wallet" &&
      account.walletClientType === "privy" &&
      account.chainType === "solana"
  );

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast.success("Address copied to clipboard");
    }
  };

  const handleViewExplorer = () => {
    if (publicKey) {
      window.open(
        `https://solscan.io/account/${publicKey.toString()}`,
        "_blank"
      );
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md px-4">
        <SheetHeader>
          <SheetTitle>Wallet Connected</SheetTitle>
          <SheetDescription>
            Your wallet is successfully connected
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6">
          {wallet && (
            <div className="flex items-center gap-3 rounded-lg">
              <div className="overflow-hidden flex items-center justify-center">
                <Image
                  src={wallet.icon || "/placeholder.png"}
                  alt={wallet.name || "Solana Wallet"}
                  height={40}
                  width={40}
                  className="rounded-full"
                />
              </div>
              <span className="font-medium text-lg">
                {wallet.name || "Solana Wallet"}
              </span>
            </div>
          )}

          {publicKey && (
            <div
              className="space-y-2 cursor-pointer group"
              onClick={handleCopyAddress}
            >
              <p className="text-sm font-medium text-muted-foreground">
                Address
              </p>
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                <span className="flex-1 truncate">
                  {publicKey.toString().slice(0, 12) +
                    "..." +
                    publicKey.toString().slice(-12)}
                </span>
                <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}

          {publicKey && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Balance
              </p>
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                {loadingBalance ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  <span className="">{solanaBalance?.toFixed(4)} SOL</span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12 rounded-lg"
              onClick={handleViewExplorer}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            {hasEmbeddedWallet && (
              <Button
                variant="outline"
                className="w-full justify-start h-12 rounded-lg"
                onClick={() =>
                  exportWallet({ address: publicKey?.toString() || "" })
                }
                disabled={!isAuthenticated || !hasEmbeddedWallet}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Wallet
              </Button>
            )}
            <Button
              variant="destructive"
              className="w-full justify-start h-12 rounded-lg"
              onClick={handleDisconnect}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
