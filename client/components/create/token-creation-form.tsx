"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";
import { SocialLinksInput } from "./social-links-input";
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
  return (
    <>
      <form onSubmit={handleSubmit} className=" ">
        <Card className="border-y border-x-0 rounded-none p-0 bg-background">
          <CardContent className="pt-6 p-0 divide-y">
            <div className="flex md:flex-row flex-col">
              <div>
                <ImageUpload
                  value={formData.image}
                  onChange={handleImageChange}
                />
              </div>
              <div className="flex-1 divide-y">
                <div className="grid grid-cols-1 md:grid-cols-2 border-b md:divide-y-0 divide-y">
                  <div>
                    <Input
                      id="name"
                      autoFocus
                      placeholder="Doge Moon"
                      value={formData.name}
                      className="md:border-r"
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Input
                      id="symbol"
                      placeholder="DOGEM"
                      value={formData.symbol}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          symbol: e.target.value.to(),
                        })
                      }
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Textarea
                    id="description"
                    placeholder="Describe your token..."
                    className="min-h-60 border-0 rounded-none resize-none"
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <SocialLinksInput
                    value={formData.socialLinks}
                    onChange={handleSocialLinksChange}
                  />
                </div>
                <div className="flex">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 border-none rounded-none py-8 md:py-12"
                    disabled={isSubmitting || !wallet.connected}
                  >
                    {!wallet.connected
                      ? "Connect Wallet"
                      : isSubmitting
                      ? "Creating Token..."
                      : "Create Token"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-none px-12 rounded-none py-8 md:py-12"
                    size="lg"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Cancel" : "Reset"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
      <Dialog open={showSuccessDialog} onOpenChange={closeSuccessDialog}>
        <DialogContent className="sm:max-w-xl bg-transparent rounded-[32px] backdrop-blur-sm border border-primary/10 p-2">
          <div className="p-6 rounded-3xl border bg-card">
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
                    <Button className="w-full">View All Tokens</Button>
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
