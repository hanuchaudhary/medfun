"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";
import { SocialLinksInput } from "./social-links-input";
import { TokenCard } from "@/components/coins/token-card";
import { Token } from "@/types/token";
import axios from "axios";
import { useWallet } from "@/hooks/use-wallet";
import {
  useSignTransaction as useSignTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import { toast } from "sonner";
import { Connection, Transaction } from "@solana/web3.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
interface TokenCreationFormProps {
  draggedImage?: string | null;
  onImageUsed?: () => void;
}
export function TokenCreationForm({
  draggedImage,
  onImageUsed,
}: TokenCreationFormProps) {
  const wallet = useWallet();
  const { wallets: walletsSolana } = useWalletsSolana();
  const { signTransaction: signTransactionSolana } = useSignTransactionSolana();

  const getPrivyWallet = () => {
    if (!wallet.wallet?.address) return null;
    return walletsSolana.find((w) => w.address === wallet.wallet?.address);
  };

  const initialFormData = {
    name: "",
    symbol: "",
    description: "",
    image: "",
    socialLinks: {
      twitter: "",
      telegram: "",
      website: "",
    },
  };
  const [formData, setFormData] = useState(initialFormData);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{
    signature: string;
    poolAddress: string;
    tokenName: string;
    tokenSymbol: string;
    tokenMint: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
  const connection = new Connection(RPC_URL, "confirmed");
  useEffect(() => {
    if (draggedImage && !formData.image) {
      setFormData({ ...formData, image: draggedImage });
      if (onImageUsed) {
        onImageUsed();
      }
    }
  }, [draggedImage]);
  const resetForm = () => {
    setFormData(initialFormData);
  };
  const closeSuccessDialog = () => {
    setShowSuccessDialog(false);
    setSuccessData(null);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.loading("Creating token...", { duration: 2000 });
    try {
      const response = await axios.post("/api/upload", {
        tokenName: formData.name,
        tokenTicker: formData.symbol,
        tokenDescription: formData.description,
        tokenImage: formData.image,
        userWallet: wallet.publicKey?.toString(),
        network: "devnet",
        twitter: formData.socialLinks.twitter || "",
        website: formData.socialLinks.website || "",
        telegram: formData.socialLinks.telegram || "",
      });
      if (response.status !== 200) {
        toast.error(response.data.error || "Error creating token");
        console.error("Error creating token:", response.data);
        return;
      }
      const {
        poolTx,
        tokenMint,
        poolAddress: responsePoolAddress,
        metadataUrl,
        imageUrl,
        vid,
      } = response.data;
      const transaction = Transaction.from(Buffer.from(poolTx, "base64"));
      if (!transaction.feePayer) {
        transaction.feePayer = wallet.publicKey!;
      }
      if (!transaction.recentBlockhash) {
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
      }

      toast.info("Please approve the transaction in your wallet", {
        description:
          "You will be prompted to sign the transaction for creating the DBC pool",
        duration: 5000,
      });

      const privyWallet = getPrivyWallet();
      if (!privyWallet) {
        toast.error("Could not find the selected Solana wallet");
        return;
      }

      const txBase64 = transaction
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");
      const signedTransactionResult = await signTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const signedBase64 = Buffer.from(
        signedTransactionResult.signedTransaction
      ).toString("base64");
      const finalResponse = await axios.post("/api/launch", {
        signedTransaction: signedBase64,
        mint: tokenMint,
        vid,
        userWallet: wallet.publicKey?.toString(),
        tokenName: formData.name,
        tokenTicker: formData.symbol,
        tokenDescription: formData.description,
        imageUrl: imageUrl,
        metadataUrl: metadataUrl,
        twitter: formData.socialLinks.twitter,
        telegram: formData.socialLinks.telegram,
        website: formData.socialLinks.website,
      });
      const { signature, poolAddress } = finalResponse.data;
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );
      if (confirmation.value.err) {
        toast.error("Transaction failed");
        return;
      }
      const tokenData = {
        signature,
        poolAddress,
        tokenMint,
        tokenName: formData.name,
        tokenSymbol: formData.symbol,
      };
      toast.success("Transaction confirmed", { duration: 5000 });
      toast.success("Woohu! Token created successfully");
      setSuccessData(tokenData);
      setShowSuccessDialog(true);
      setFormData(initialFormData);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      toast.dismiss();
      setIsSubmitting(false);
    }
  };
  const handleImageChange = (image: string) => {
    setFormData({ ...formData, image });
  };
  const handleSocialLinksChange = (
    socialLinks: typeof formData.socialLinks
  ) => {
    setFormData({ ...formData, socialLinks });
  };

  // Create preview token data
  const previewToken: Token = useMemo(
    () => ({
      name: formData.name || "Your Token Name",
      symbol: formData.symbol || "SYMBOL",
      description:
        formData.description || "Your token description will appear here...",
      imageUrl: formData.image || null,
      mintAddress: "Preview",
      poolAddress: "Preview",
      creatorAddress: wallet.publicKey?.toString() || "",
      website: formData.socialLinks.website || null,
      twitter: formData.socialLinks.twitter || null,
      telegram: formData.socialLinks.telegram || null,
      metadataUrl: null,
      bondingCurveProgress: 15.5,
      volume: 12500,
      liquidity: 8500,
      marketCap: 45000,
      holderCount: 128,
      stats5m: null,
      stats1h: null,
      stats6h: null,
      stats24h: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [formData, wallet.publicKey]
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Create new coin</h2>
              <div className="space-y-1">
                <p className="text-sm font-medium">Coin details</p>
                <p className="text-sm text-muted-foreground">
                  Choose carefully, these can't be changed once the coin is
                  created
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Coin name
                </label>
                <Input
                  id="name"
                  autoFocus
                  placeholder="Name your coin"
                  value={formData.name}
                  className="rounded-lg"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="symbol" className="text-sm font-medium">
                  Ticker
                </label>
                <Input
                  id="symbol"
                  placeholder="Add a coin ticker (e.g. DOGE)"
                  value={formData.symbol}
                  className="rounded-lg"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      symbol: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description{" "}
                <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                id="description"
                placeholder="Write a short description"
                className="min-h-32 rounded-lg resize-none"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <SocialLinksInput
                value={formData.socialLinks}
                onChange={handleSocialLinksChange}
              />
            </div>

            <div className="space-y-4">
              <ImageUpload
                value={formData.image}
                onChange={handleImageChange}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-lg py-6 text-background font-semibold bg-primary hover:bg-primary/90"
              disabled={isSubmitting || !wallet.connected}
            >
              {!wallet.connected
                ? "Connect Wallet"
                : isSubmitting
                ? "Creating coin..."
                : "Create coin"}
            </Button>
          </div>

          <div className="hidden md:block">
            <div className="sticky top-6 space-y-4">
              <h3 className="text-xl font-semibold">Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                A preview of how the coin will look like
              </p>
              <div className="border rounded-lg p-4 bg-card">
                <TokenCard token={previewToken} href="#" />
              </div>
            </div>
          </div>
        </div>
      </form>
      <Dialog open={showSuccessDialog} onOpenChange={closeSuccessDialog}>
        <DialogContent className="sm:max-w-xl rounded-[32px] backdrop-blur-sm border border-primary/10">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">
                Token Created Successfully! :tada:
              </DialogTitle>
              <DialogDescription className="text-center">
                Your token has been launched on TokunLunchpad
              </DialogDescription>
            </DialogHeader>
            {successData && (
              <div className="space-y-4 mt-4 ">
                <div className="bg-muted p-4 rounded-2xl space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Token Name</p>
                    <p className="text-lg font-bold">
                      {successData.tokenName} ({successData.tokenSymbol})
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Transaction</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(successData.signature)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs font-mono break-all">
                      {successData.signature}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Pool Address</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(successData.poolAddress)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs font-mono break-all">
                      {successData.poolAddress}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      window.open(
                        `https://solscan.io/token/${successData.tokenMint}?cluster=devnet`,
                        "_blank"
                      )
                    }
                  >
                    View on Solscan
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                  <Link href="/coins" className="flex-1">
                    <Button className="w-full font-semibold text-background">View All Tokens</Button>
                  </Link>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={closeSuccessDialog}
                >
                  Create Another Token
                </Button>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
