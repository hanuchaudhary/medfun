"use client";

import { useWallet } from "@/hooks/use-wallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";
import React from "react";
import { Connection } from "@solana/web3.js";
import Image from "next/image";

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
  const [solanaBalance, setSolanaBalance] = React.useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = React.useState(false);

  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL!,
    "confirmed"
  );
  React.useEffect(() => {
    if (!publicKey) return;
    const fetchBalance = async () => {
      setLoadingBalance(true);
      const lamports = await connection.getBalance(publicKey!);
      setSolanaBalance(lamports / 1e9);
      setLoadingBalance(false);
    };
    fetchBalance();
  }, [publicKey]);

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-transparent rounded-[32px] backdrop-blur-sm border border-primary/10 p-2">
        <div className="p-6 rounded-3xl border bg-card">
          <DialogHeader className="mb-2">
            <DialogTitle>Wallet Connected</DialogTitle>
            <DialogDescription>
              Your wallet is successfully connected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {wallet && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-full">
                <div className="overflow-hidden flex items-center justify-center">
                  <Image
                    src={wallet.icon || "/placeholder.png"}
                    alt={wallet.name || "Solana Wallet"}
                    height={60}
                    width={60}
                    className="rounded-full"
                  />
                </div>
                <span className="font-medium">
                  {wallet.name || "Solana Wallet"}
                </span>
              </div>
            )}

            {publicKey && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                  <span className="flex-1 truncate text-center">
                    {publicKey.toString().slice(0, 12) +
                      "..." +
                      publicKey.toString().slice(-12)}
                  </span>
                </div>
              </div>
            )}

            {publicKey && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Balance</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                  {loadingBalance ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <span className="font-medium">
                      {solanaBalance?.toFixed(4)} SOL
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCopyAddress}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleViewExplorer}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleDisconnect}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
