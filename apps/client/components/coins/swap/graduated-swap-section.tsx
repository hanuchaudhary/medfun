"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/use-wallet";
import { useBalance } from "@/hooks/use-balance";
import {
  useSignAndSendTransaction as useSendTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { CpAmm } from "@meteora-ag/cp-amm-sdk";
import BN from "bn.js";
import { toast } from "sonner";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useCurrentToken } from "../token/token-page-wrapper";
import { getTokenBalance } from "@/lib/helius";
import bs58 from "bs58";

interface GraduatedSwapSectionProps {
  activeTab?: "buy" | "sell";
  onTabChange?: (tab: "buy" | "sell") => void;
}

export function GraduatedSwapSection({
  activeTab = "buy",
  onTabChange,
}: GraduatedSwapSectionProps) {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [buyOutputAmount, setBuyOutputAmount] = useState("");
  const [sellOutputAmount, setSellOutputAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const buyDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const sellDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const current = useCurrentToken();
  const GRADUATED_POOL_ADDRESS = new PublicKey(
    current?.graduatedPoolAddress! ||
      "HKLXtngZBf4BLya8pMyuRyMmiYQj2NXKEwNQJ1Encx7d"
  );

  const TOKEN_SYMBOL = "TKN";
  const SLIPPAGE = 0.5;

  const wallet = useWallet();
  const { wallets: walletsSolana } = useWalletsSolana();
  const { signAndSendTransaction: sendTransactionSolana } =
    useSendTransactionSolana();
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL!,
    "confirmed"
  );

  useEffect(() => {
    if (!wallet.connected || !current?.mintAddress) return;

    (async () => {
      const balance = await getTokenBalance(
        wallet.publicKey!.toBase58() as any,
        current?.mintAddress! as any
      );
      console.log("Balance", balance);
    })();
  });

  const { balance: solBalance, isLoading: balanceLoading } = useBalance({
    publicKey: wallet.publicKey,
    refetchInterval: 30000,
  });

  const cpAmm = new CpAmm(connection);

  const getPrivyWallet = () => {
    if (!wallet.wallet?.address) return null;
    return walletsSolana.find((w) => w.address === wallet.wallet?.address);
  };

  const getQuote = useCallback(
    async (amount: number, isBuy: boolean) => {
      try {
        const poolState = await cpAmm.fetchPoolState(GRADUATED_POOL_ADDRESS);
        if (!poolState) return null;

        const currentSlot = await connection.getSlot();
        const blockTime = await connection.getBlockTime(currentSlot);
        if (blockTime === null) return null;

        const amountIn = new BN(Math.floor(amount * (isBuy ? 1e9 : 1e6)));
        const inputMint = isBuy ? poolState.tokenAMint : poolState.tokenBMint;
        const tokenADecimal = 9;
        const tokenBDecimal = 6;

        const quote = await cpAmm.getQuote({
          inAmount: amountIn,
          inputTokenMint: inputMint,
          slippage: SLIPPAGE,
          poolState,
          currentTime: blockTime,
          currentSlot,
          tokenADecimal,
          tokenBDecimal,
        });

        console.log("swapout: ", new BN(quote.swapOutAmount).toNumber());

        const outputAmount =
          parseFloat(quote.swapOutAmount.toString()) / (isBuy ? 1e6 : 1e9);
        return outputAmount;
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        return null;
      }
    },
    [GRADUATED_POOL_ADDRESS, SLIPPAGE, connection, cpAmm]
  );

  const fetchBuyQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        setBuyOutputAmount("");
        return;
      }
      setIsFetchingQuote(true);
      try {
        const outputAmount = await getQuote(parseFloat(amount), true);
        if (outputAmount !== null) {
          setBuyOutputAmount(outputAmount.toFixed(6));
        }
      } catch (error) {
        console.error("Failed to fetch buy quote:", error);
        setBuyOutputAmount("");
      } finally {
        setIsFetchingQuote(false);
      }
    },
    [getQuote]
  );

  const fetchSellQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        setSellOutputAmount("");
        return;
      }
      setIsFetchingQuote(true);
      try {
        const outputAmount = await getQuote(parseFloat(amount), false);
        if (outputAmount !== null) {
          setSellOutputAmount(outputAmount.toFixed(6));
        }
      } catch (error) {
        console.error("Failed to fetch sell quote:", error);
        setSellOutputAmount("");
      } finally {
        setIsFetchingQuote(false);
      }
    },
    [getQuote]
  );

  const handleBuyAmountChange = (value: string) => {
    setBuyAmount(value);

    if (buyDebounceTimer.current) {
      clearTimeout(buyDebounceTimer.current);
    }

    if (value && parseFloat(value) > 0) {
      buyDebounceTimer.current = setTimeout(() => {
        fetchBuyQuote(value);
      }, 500);
    } else {
      setBuyOutputAmount("");
    }
  };

  const handleSellAmountChange = (value: string) => {
    setSellAmount(value);

    if (sellDebounceTimer.current) {
      clearTimeout(sellDebounceTimer.current);
    }

    if (value && parseFloat(value) > 0) {
      sellDebounceTimer.current = setTimeout(() => {
        fetchSellQuote(value);
      }, 500);
    } else {
      setSellOutputAmount("");
    }
  };

  async function performCpAmmSwap(amountIn: BN, swapAToB: boolean) {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    const privyWallet = getPrivyWallet();
    if (!privyWallet) {
      toast.error("Could not find the selected Solana wallet");
      return;
    }

    const toastId = toast.loading("Fetching pool state...");

    const poolState = await cpAmm.fetchPoolState(GRADUATED_POOL_ADDRESS);
    if (!poolState) {
      toast.error("Pool state not found", { id: toastId });
      throw new Error("Pool state not found");
    }

    const currentSlot = await connection.getSlot();
    const blockTime = await connection.getBlockTime(currentSlot);
    if (blockTime === null) {
      toast.error("Unable to fetch block time", { id: toastId });
      throw new Error("Unable to fetch block time");
    }

    toast.loading("Calculating quote...", { id: toastId });

    const inputMint = swapAToB ? poolState.tokenAMint : poolState.tokenBMint;
    const outputMint = swapAToB ? poolState.tokenBMint : poolState.tokenAMint;
    const tokenADecimal = 9;
    const tokenBDecimal = 6;

    const quote = await cpAmm.getQuote({
      inAmount: amountIn,
      inputTokenMint: inputMint,
      slippage: SLIPPAGE,
      poolState,
      currentTime: blockTime,
      currentSlot,
      tokenADecimal,
      tokenBDecimal,
    });

    toast.loading("Preparing swap transaction...", { id: toastId });

    const swapTx = await cpAmm.swap({
      payer: wallet.publicKey,
      pool: GRADUATED_POOL_ADDRESS,
      inputTokenMint: inputMint,
      outputTokenMint: outputMint,
      amountIn: amountIn,
      minimumAmountOut: quote.minSwapOutAmount,
      tokenAVault: poolState.tokenAVault,
      tokenBVault: poolState.tokenBVault,
      tokenAMint: poolState.tokenAMint,
      tokenBMint: poolState.tokenBMint,
      tokenAProgram: TOKEN_PROGRAM_ID,
      tokenBProgram: TOKEN_PROGRAM_ID,
      referralTokenAccount: null,
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    swapTx.recentBlockhash = blockhash;
    swapTx.lastValidBlockHeight = lastValidBlockHeight;
    swapTx.feePayer = wallet.publicKey;

    toast.loading("Please approve the transaction in your wallet", {
      id: toastId,
    });

    const txBase64 = swapTx
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64");
    const result = await sendTransactionSolana({
      transaction: Buffer.from(txBase64, "base64"),
      wallet: privyWallet,
    });
    const signature = bs58.encode(result.signature);

    toast.success("Swap completed successfully!", {
      id: toastId,
      description: `Transaction: ${signature.slice(0, 8)}...`,
      duration: 10000,
      action: {
        label: "View on Solscan",
        onClick: () =>
          window.open(
            `https://solscan.io/tx/${signature}?cluster=devnet`,
            "_blank"
          ),
      },
    });
  }

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      setIsLoading(true);
      const lamports = new BN(Math.floor(parseFloat(buyAmount) * 1e9));
      await performCpAmmSwap(lamports, false);
      setBuyAmount("");
    } catch (e: any) {
      toast.error(e?.message || "Swap failed");
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  const handleSell = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      setIsLoading(true);
      const baseUnits = new BN(Math.floor(parseFloat(sellAmount) * 1e6));
      await performCpAmmSwap(baseUnits, true);
      setSellAmount("");
    } catch (e: any) {
      toast.error(e?.message || "Swap failed");
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  return (
    <Card className="border-0 rounded-none p-0 gap-0">
      <CardContent className="p-0 gap-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange?.(v as "buy" | "sell")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger className="" value="buy">
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy">
            <div className="flex justify-between items-center p-3">
              <span className="text-sm text-muted-foreground">balance:</span>
              <span className="text-sm">
                {balanceLoading
                  ? "Loading..."
                  : `${solBalance?.toFixed(6) || "0"} SOL`}
              </span>
            </div>

            <div className="relative">
              <Input
                className="w-full border rounded-xl pr-20 py-3"
                id="buy-from"
                type="number"
                placeholder="0.0"
                value={buyAmount}
                onChange={(e) => handleBuyAmountChange(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <span className="text-sm font-medium">SOL</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs">◎</span>
                </div>
              </div>
            </div>
            <div className="flex py-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() => {
                  const amount = (solBalance || 0) * 0.25;
                  handleBuyAmountChange(amount.toString());
                }}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() => {
                  const amount = (solBalance || 0) * 0.5;
                  handleBuyAmountChange(amount.toString());
                }}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() => {
                  const amount = (solBalance || 0) * 0.75;
                  handleBuyAmountChange(amount.toString());
                }}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border"
                onClick={() => {
                  const amount = solBalance || 0;
                  handleBuyAmountChange(amount.toString());
                }}
              >
                100%
              </Button>
            </div>

            {isFetchingQuote ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                Loading quote...
              </div>
            ) : buyOutputAmount ? (
              <div className="text-center py-2 text-sm">
                <span className="text-muted-foreground">you receive </span>
                <span className="font-medium">
                  {buyOutputAmount} {TOKEN_SYMBOL}
                </span>
              </div>
            ) : null}

            <Button
              onClick={handleBuy}
              className="w-full text-background"
              size="lg"
              disabled={
                !wallet.connected ||
                isLoading ||
                !buyAmount ||
                parseFloat(buyAmount) <= 0
              }
            >
              {!wallet.connected
                ? "Connect Wallet"
                : isLoading
                  ? "Processing..."
                  : `Buy ${TOKEN_SYMBOL}`}
            </Button>
          </TabsContent>

          <TabsContent value="sell">
            <div className="flex justify-between items-center p-3">
              <span className="text-sm text-muted-foreground">balance:</span>
              <span className="text-sm">0 {TOKEN_SYMBOL}</span>
            </div>

            <div className="relative">
              <Input
                className="w-full border rounded-xl pr-20 py-3"
                id="sell-from"
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => handleSellAmountChange(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <span className="text-sm font-medium">{TOKEN_SYMBOL}</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs">T</span>
                </div>
              </div>
            </div>

            <div className="flex py-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() => setSellAmount("0")}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() => setSellAmount("0")}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() => setSellAmount("0")}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border"
                onClick={() => setSellAmount("0")}
              >
                100%
              </Button>
            </div>

            {isFetchingQuote ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                Loading quote...
              </div>
            ) : sellOutputAmount ? (
              <div className="text-center py-2 text-sm">
                <span className="text-muted-foreground">you receive </span>
                <span className="font-medium">{sellOutputAmount} SOL</span>
              </div>
            ) : null}

            <Button
              onClick={handleSell}
              className="w-full text-background"
              size="lg"
              variant="destructive"
              disabled={
                !wallet.connected ||
                isLoading ||
                !sellAmount ||
                parseFloat(sellAmount) <= 0
              }
            >
              {!wallet.connected
                ? "Connect Wallet"
                : isLoading
                  ? "Processing..."
                  : `Sell ${TOKEN_SYMBOL}`}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default GraduatedSwapSection;
