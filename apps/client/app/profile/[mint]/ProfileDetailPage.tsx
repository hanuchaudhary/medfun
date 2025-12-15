"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BackButton from "@/components/BackButton";
import { useWallet } from "@/hooks/use-wallet";
import {
  useSignAndSendTransaction as useSendTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ClaimCreatorTradingFee2Params,
  DynamicBondingCurveClient,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { toast } from "sonner";
import BN from "bn.js";
import { Token } from "@/types/token";
import axios from "axios";
import Link from "next/link";
import { IconBrandTelegram, IconBrandX, IconWorld } from "@tabler/icons-react";
import { icons } from "lucide-react";

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
        const res = await axios.get(`/api/coins/${mint}`);
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

  const claimFees = React.useCallback(async () => {
    if (!client || !wallet?.publicKey || !mint) {
      toast.error("Missing client or wallet info");
      return;
    }

    try {
      setLoading(true);

      const params: ClaimCreatorTradingFee2Params = {
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
      <div className="relative max-w-7xl border rounded-lg mx-auto">
        <BackButton />
        <div className="p-8 animate-pulse">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-muted rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-8 bg-muted w-48 rounded-lg"></div>
              <div className="h-4 bg-muted w-96 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="relative max-w-7xl border rounded-lg mx-auto">
        <div className="p-8">
          <p className="text-destructive">Token not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto md:px-0 px-4 overflow-hidden">
      <div className="border-b border-dashed p-8">
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <Image
              unoptimized
              src={
                token.imageUrl ||
                "https://i.pinimg.com/1200x/b7/8f/02/b78f023aa1bca7bdada28db1c30d1fe5.jpg"
              }
              alt={token.name}
              fill
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{token.name}</h1>
              <Badge
                variant="secondary"
                className="text-sm rounded-lg text-primary"
              >
                {token.symbol}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm break-all mb-4">
              {token.mintAddress}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Market Cap</p>
                <p className="text-sm font-semibold">
                  ${token.marketCap?.toLocaleString() ?? "0"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="text-sm font-semibold">
                  ${token.volume?.toLocaleString() ?? "0"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Liquidity</p>
                <p className="text-sm font-semibold">
                  ${token.liquidity?.toLocaleString() ?? "0"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-semibold">
                  {token.bondingCurveProgress?.toFixed(2) ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y divide-dashed lg:divide-y-0 lg:divide-x">
        <div className="">
          <div className="">
            {feeMetrics && (
              <div className="p-4 bg-muted/50 border-b border-dashed">
                <p className="text-sm text-center font-medium">
                  Available to Claim
                </p>
                <p className="md:text-3xl font-bold text-center my-3 text-primary">
                  {(
                    feeMetrics.current.creatorQuoteFee.toNumber() /
                    LAMPORTS_PER_SOL
                  ).toFixed(4)}{" "}
                  SOL
                </p>
              </div>
            )}
            <div className="p-4">
              <Button
                onClick={claimFees}
                disabled={loading || !wallet.connected}
                className="w-full rounded-lg py-6 font-semibold text-background"
              >
                {loading ? "Claiming..." : "Claim Fees"}
              </Button>
              {!wallet.connected && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Connect wallet to claim fees
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-muted-foreground">
                {description || "No description provided"}
              </p>
            </div>
          </div>

          <div className="relative border-t border-dashed">
            <div className="">
              <h2 className="text-sm font-medium m-4">Social Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-dashed border-y border-dashed divide-x">
                {[
                  { label: "Twitter", value: twitter, icon: IconWorld },
                  {
                    label: "Telegram",
                    value: telegram,
                    icon: IconBrandTelegram,
                  },
                  { label: "Website", value: website, icon: IconBrandX },
                ].map((social) => (
                  <div
                    key={social.label}
                    className="flex flex-col p-4 bg-muted/20"
                  >
                    {social.value ? (
                      <Link
                        href={social.value}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {social.icon &&
                          React.createElement(social.icon, {
                            className: "inline-block size-5 text-primary",
                          })}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
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
