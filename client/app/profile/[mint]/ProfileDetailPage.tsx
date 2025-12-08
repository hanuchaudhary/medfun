"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BackButton from "@/components/BackButton";
import Pattern from "@/components/landing/pattern";
import { useWallet } from "@/hooks/use-wallet";
import {
  useSignAndSendTransaction as useSendTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ClaimCreatorTradingFee2Param,
  DynamicBondingCurveClient,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { toast } from "sonner";
import BN from "bn.js";
import { Token } from "@/types/token";
import axios from "axios";

type FeeMetrics = {
  current: {
    partnerBaseFee: BN;
    partnerQuoteFee: BN;
    creatorBaseFee: BN;
    creatorQuoteFee: BN;
  };
  total: {
    totalTradingBaseFee: BN;
    totalTradingQuoteFee: BN;
  };
};

export default function ProfileDetailPage({
  mint,
}: {
  mint: string;
  poolAddress?: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);

  const [feeMetrics, setFeeMetrics] = useState<FeeMetrics | null>(null);

  const wallet = useWallet();
  const { wallets: walletsSolana } = useWalletsSolana();
  const { signAndSendTransaction: sendTransactionSolana } =
    useSendTransactionSolana();
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL!,
    "confirmed"
  );

  const client = new DynamicBondingCurveClient(connection, "confirmed");

  const getPrivyWallet = () => {
    if (!wallet.wallet?.address) return null;
    return walletsSolana.find((w) => w.address === wallet.wallet?.address);
  };

  // useEffect(() => {
  //   if (!wallet.connected) {
  //     toast.error("Please connect your wallet to access this page");
  //     router.push("/profile");
  //   }
  // }, [wallet.connected, router]);

  // useEffect(() => {
  //   if (token && wallet.wallet?.address) {
  //     if (token.creatorAddress !== wallet.wallet.address) {
  //       toast.error("You are not the creator of this token");
  //       router.push("/profile");
  //     }
  //   }
  // }, [token, wallet.wallet?.address, router]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/api/tokens/${mint}`);
        const data = res.data;

        if (!data.success || !data.token) {
          toast.error(data.error || "Failed to fetch token");
          return;
        }

        // const fees = await client.state.getPoolsFeesByConfig(
        //   "28eYKBRnoVjVCHaJUeLKYzZyBJR3c5TG1UMGQccpSZgE"
        // );
        // let sum = 0;
        // console.log(
        //   "fees",
        //   fees.map((fee) => {
        //     if (fee.partnerQuoteFee.toNumber() > 0) {
        //       sum += fee.partnerQuoteFee.toNumber() / LAMPORTS_PER_SOL;
        //       return fee.partnerQuoteFee.toNumber() / LAMPORTS_PER_SOL;
        //     }
        //   })
        // );

        // console.log("sum", sum);

        const metricRes = await client.state.getPoolFeeMetrics(
          new PublicKey(data.token.poolAddress)
        );

        console.log(
          `Fetched fee metrics:`,
          metricRes.current.creatorQuoteFee.toNumber() / LAMPORTS_PER_SOL
        );

        setFeeMetrics(metricRes);
        setToken(data.token);
        setDescription(data.token.description || "");
        setTwitter(data.token.twitter || "");
        setTelegram(data.token.telegram || "");
        setWebsite(data.token.website || "");
      } catch (err) {
        console.error("Error fetching token:", err);
        toast.error("Failed to load token data");
      } finally {
        setIsLoading(false);
      }
    };

    console.log("fere met", feeMetrics);

    if (mint) {
      fetchToken();
    }
  }, [mint]);

  // const handleSaveDescription = async () => {
  //   if (!token) return;

  //   try {
  //     setIsSaving(true);
  //     const res = await fetch(`/api/tokens/${mint}`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ description }),
  //     });

  //     const data = await res.json();

  //     if (!data.success) {
  //       toast.error(data.error || "Failed to update description");
  //       return;
  //     }

  //     setToken(data.token);
  //     toast.success("Description updated successfully!");
  //   } catch (err) {
  //     console.error("Error updating description:", err);
  //     toast.error("Failed to update description");
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  // const handleSaveSocialLinks = async () => {
  //   if (!token) return;

  //   try {
  //     setIsSaving(true);
  //     const res = await fetch(`/api/tokens/${mint}`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ twitter, telegram, website }),
  //     });

  //     const data = await res.json();

  //     if (!data.success) {
  //       toast.error(data.error || "Failed to update social links");
  //       return;
  //     }

  //     setToken(data.token);
  //     toast.success("Social links updated successfully!");
  //   } catch (err) {
  //     console.error("Error updating social links:", err);
  //     toast.error("Failed to update social links");
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const claimFees = React.useCallback(async () => {
    if (!client || !wallet?.publicKey || !mint) {
      toast.error("Missing client or wallet info");
      return;
    }

    try {
      setLoading(true);

      const params: ClaimCreatorTradingFee2Param = {
        creator: wallet.publicKey,
        payer: wallet.publicKey,
        pool: new PublicKey(token?.poolAddress || mint),
        maxBaseAmount: new BN(1_000_000_000_000),
        maxQuoteAmount: new BN(1_000_000_000_000),
        receiver: wallet.publicKey,
      };
      const tx = await client.creator.claimCreatorTradingFee2(params);

      const privyWallet = getPrivyWallet();
      if (!privyWallet) {
        toast.error("Could not find the selected Solana wallet");
        return;
      }

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const txBase64 = tx
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");
      const result = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const txSig = result.signature;
      toast.success(`Fees claimed! Tx: ${txSig}`);
    } catch (err) {
      console.error("Claim fees error:", err);
      toast.error("Failed to claim fees");
    } finally {
      setLoading(false);
    }
  }, [client, wallet, mint, token?.poolAddress, connection]);

  if (isLoading) {
    return (
      <div className="relative max-w-7xl border-x border-b mx-auto">
        <Pattern />
        <BackButton />
        <div className="p-8 animate-pulse">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-8 bg-muted w-48 rounded"></div>
              <div className="h-4 bg-muted w-96 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="relative max-w-7xl border-x border-b mx-auto">
        <Pattern />
        <BackButton />
        <div className="p-8">
          <p className="text-destructive">Token not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl border-x border-b mx-auto md:px-0 px-4">
      <Pattern />
      <BackButton />
      <div className="border-b p-8">
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              unoptimized
              src={
                token.imageUrl ||
                "https://i.pinimg.com/1200x/b7/8f/02/b78f023aa1bca7bdada28db1c30d1fe5.jpg"
              }
              alt={token.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{token.name}</h1>
              <Badge variant="secondary" className="text-sm">
                {token.symbol}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm break-all mb-4">
              {token.mintAddress}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Market Cap</p>
                <p className="text-sm font-semibold">
                  ${token.marketCap?.toLocaleString() ?? "0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="text-sm font-semibold">
                  ${token.volume?.toLocaleString() ?? "0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Liquidity</p>
                <p className="text-sm font-semibold">
                  ${token.liquidity?.toLocaleString() ?? "0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-semibold">
                  {token.bondingCurveProgress?.toFixed(2) ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x">
        <div className="">
          <div className="">
            {feeMetrics && (
              <div className="p-4 rounded-none bg-muted/50 border-b">
                <p className="text-sm text-center font-medium">
                  Available to Claim
                </p>
                <p className="md:text-3xl font-bold text-center my-5 text-primary">
                  {(
                    feeMetrics.current.creatorQuoteFee.toNumber() /
                    LAMPORTS_PER_SOL
                  ).toFixed(4)}{" "}
                  SOL
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Creator trading fees accumulated
                </p>
              </div>
            )}
            <div className="p-8">
              <p className="text-sm text-muted-foreground">
                Claim creator trading fees
              </p>
              <p className="text-sm text-muted-foreground">
                Connect your wallet and claim fees earned from trading activity
              </p>
            </div>
            <Button
              onClick={claimFees}
              disabled={loading || !wallet.connected}
              className="w-full rounded-none py-10"
            >
              {loading ? "Claiming..." : "Claim Fees"}
            </Button>
            {!wallet.connected && (
              <p className="text-xs text-muted-foreground text-center">
                Connect wallet to claim fees
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="p-6">
            <div className="space-y-4">
              <p className="rounded-none">{description}</p>
            </div>
          </div>

          <Separator />

          <div className="relative">
            <div className="relative">
              <div className="w-full h-10 pointer-events-none md:border-l border-r bg-[image:repeating-linear-gradient(315deg,_#0000000d_0,_#0000000d_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed dark:bg-[image:repeating-linear-gradient(315deg,_#ffffff1a_0,_#ffffff0a_1px,_transparent_0,_transparent_50%)] border-b" />
              <h2 className="absolute text-sm font-medium top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                Social Links
              </h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3">
                {[
                  { label: "Twitter", value: twitter },
                  { label: "Telegram", value: telegram },
                  { label: "Website", value: website },
                ]
                  .filter((social) => social.value)
                  .map((social) => (
                    <div
                      key={social.label}
                      className="flex flex-col gap-2 p-4 border"
                    >
                      <label className="text-sm font-medium text-muted-foreground">
                        {social.label}
                      </label>
                      <a
                        className="hover:underline break-all hover:text-primary transition-colors"
                        href={social.value}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {social.value}
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
