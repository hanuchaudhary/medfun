"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp } from "lucide-react";
import {
  DynamicBondingCurveClient,
  getCurrentPoint,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { useWallet } from "@/hooks/use-wallet";
import {
  useSignAndSendTransaction as useSendTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import { Connection } from "@solana/web3.js";
import BN from "bn.js";
import { toast } from "sonner";
import { TOKEN_POOL_ADDRESS } from "@/app/constant";
import { useQuery } from "@tanstack/react-query";
// import { fetchSolBalance } from "@/lib/actions";
import Image from "next/image";

interface SwapSectionProps {
  tokenId: string;
}

export function SwapSection({ tokenId }: SwapSectionProps) {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [buyOutputAmount, setBuyOutputAmount] = useState("");
  const [sellOutputAmount, setSellOutputAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [SOLPrice, setSOLPrice] = useState<number | null>(null);
  const [tokenPriceUSD, setTokenPriceUSD] = useState<string | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const buyDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const sellDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const priceRefetchTimer = useRef<NodeJS.Timeout | null>(null);

  const POOL_ADDRESS = TOKEN_POOL_ADDRESS;

  const fetchPrices = useCallback(async () => {
    setIsFetchingPrice(true);
    try {
      const response = await fetch("https://gated.chat/price/sol");
      const solPriceData = await response.json();
      setSOLPrice(solPriceData);

      try {
        const { outputAmount } = await getSwapQuote(1, true);
        const pricePerToken = solPriceData * outputAmount;
        setTokenPriceUSD(pricePerToken.toFixed(6));
      } catch (error) {
        console.error("Failed to fetch token quote:", error);
        setTokenPriceUSD(null);
      }
    } catch (error) {
      console.error("Failed to fetch SOL price:", error);
      setSOLPrice(null);
      setTokenPriceUSD(null);
    } finally {
      setIsFetchingPrice(false);
    }
  }, [POOL_ADDRESS]);

  useEffect(() => {
    fetchPrices();

    priceRefetchTimer.current = setInterval(() => {
      fetchPrices();
    }, 30000);

    return () => {
      if (priceRefetchTimer.current) {
        clearInterval(priceRefetchTimer.current);
      }
    };
  }, [fetchPrices]);

  const TOKEN_SYMBOL = "TOKEN";
  const SLIPPAGE_BPS = 100;

  const wallet = useWallet();
  const { wallets: walletsSolana } = useWalletsSolana();
  const { signAndSendTransaction: sendTransactionSolana } = useSendTransactionSolana();
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL!,
    "confirmed"
  );

  const getPrivyWallet = () => {
    if (!wallet.wallet?.address) return null;
    return walletsSolana.find((w) => w.address === wallet.wallet?.address);
  };

  const { data: solBalance, isLoading: balanceLoading } = useQuery({
    enabled: !!wallet.publicKey,
    queryKey: ["sol-balance", wallet.publicKey?.toString()],
    queryFn: async () => {
      if (!wallet.publicKey) return 0;
      // return await fetchSolBalance(connection, wallet.publicKey);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const getSwapQuote = async (amount: number, isBuy: boolean) => {
    const client = new DynamicBondingCurveClient(connection, "confirmed");
    const virtualPoolState = await client.state.getPool(POOL_ADDRESS);
    const poolConfigState = await client.state.getPoolConfig(
      virtualPoolState.config
    );
    const currentPoint = await getCurrentPoint(
      connection,
      poolConfigState.activationType
    );

    const decimals = isBuy ? 9 : 6; // SOL:9, Token:6
    const amountIn = new BN(Math.floor(amount * Math.pow(10, decimals)));

    const quote = await client.pool.swapQuote({
      virtualPool: virtualPoolState,
      config: poolConfigState,
      swapBaseForQuote: !isBuy,
      amountIn,
      slippageBps: SLIPPAGE_BPS,
      hasReferral: false,
      currentPoint,
    });

    return {
      quote,
      outputAmount:
        parseFloat(quote.outputAmount.toString()) / Math.pow(10, isBuy ? 6 : 9),
    };
  };

  const fetchBuyQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        setBuyOutputAmount("");
        return;
      }
      setIsFetchingQuote(true);
      try {
        const { outputAmount } = await getSwapQuote(parseFloat(amount), true);
        setBuyOutputAmount(outputAmount.toFixed(9));
      } catch (error) {
        console.error("Failed to fetch buy quote:", error);
        setBuyOutputAmount("");
      } finally {
        setIsFetchingQuote(false);
      }
    },
    [POOL_ADDRESS, SLIPPAGE_BPS]
  );

  const fetchSellQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        setSellOutputAmount("");
        return;
      }

      setIsFetchingQuote(true);
      try {
        const { outputAmount } = await getSwapQuote(parseFloat(amount), false);
        setSellOutputAmount(outputAmount.toFixed(9));
      } catch (error) {
        console.error("Failed to fetch sell quote:", error);
        setSellOutputAmount("");
      } finally {
        setIsFetchingQuote(false);
      }
    },
    [POOL_ADDRESS, SLIPPAGE_BPS]
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

  useEffect(() => {
    return () => {
      if (buyDebounceTimer.current) {
        clearTimeout(buyDebounceTimer.current);
      }
      if (sellDebounceTimer.current) {
        clearTimeout(sellDebounceTimer.current);
      }
    };
  }, []);

  const handleBuy = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    const privyWallet = getPrivyWallet();
    if (!privyWallet) {
      toast.error("Could not find the selected Solana wallet");
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing swap transaction...");

    try {
      const client = new DynamicBondingCurveClient(connection, "confirmed");

      toast.loading("Getting swap quote...", { id: toastId });
      const { quote } = await getSwapQuote(parseFloat(buyAmount), true);
      console.log("Swap quote:", quote);
      const swapParam = {
        amountIn: new BN(Math.floor(parseFloat(buyAmount) * 1e9)),
        minimumAmountOut: quote.minimumAmountOut,
        swapBaseForQuote: false,
        owner: wallet.publicKey,
        pool: POOL_ADDRESS,
        referralTokenAccount: null,
      };

      toast.loading("Creating swap transaction...", { id: toastId });
      const swapTransaction = await client.pool.swap(swapParam);

      const { blockhash } = await connection.getLatestBlockhash();
      swapTransaction.recentBlockhash = blockhash;
      swapTransaction.feePayer = wallet.publicKey;

      toast.loading("Awaiting confirmation...", { id: toastId });

      const txBase64 = swapTransaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
      const result = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const signature = result.signature;

      toast.success(
        <div className="flex flex-col gap-1">
          <p>Swap successful!</p>
          <a
            href={`https://solscan.io/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
          >
            View on Solscan
          </a>
        </div>,
        { id: toastId, duration: 5000 }
      );

      setBuyAmount("");
    } catch (error: any) {
      console.error("Swap failed:", error);
      toast.error(error?.message || "Failed to execute swap", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    const privyWallet = getPrivyWallet();
    if (!privyWallet) {
      toast.error("Could not find the selected Solana wallet");
      return;
    }

    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing swap transaction...");

    try {
      const client = new DynamicBondingCurveClient(connection, "confirmed");
      toast.loading("Getting swap quote...", { id: toastId });
      const { quote } = await getSwapQuote(parseFloat(sellAmount), false);
      const swapParam = {
        amountIn: new BN(parseFloat(sellAmount) * 1e6),
        minimumAmountOut: quote.minimumAmountOut,
        swapBaseForQuote: true,
        owner: wallet.publicKey,
        pool: POOL_ADDRESS,
        referralTokenAccount: null,
      };

      toast.loading("Creating swap transaction...", { id: toastId });
      const swapTransaction = await client.pool.swap(swapParam);

      const { blockhash } = await connection.getLatestBlockhash();
      swapTransaction.recentBlockhash = blockhash;
      swapTransaction.feePayer = wallet.publicKey;

      toast.loading("Awaiting confirmation...", { id: toastId });

      const txBase64 = swapTransaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
      const result = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const signature = result.signature;

      toast.success(
        <div className="flex flex-col gap-1">
          <p>Swap successful!</p>
          <a
            href={`https://solscan.io/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
          >
            View on Solscan
          </a>
        </div>,
        { id: toastId, duration: 5000 }
      );

      setSellAmount("");
    } catch (error: any) {
      console.error("Swap failed:", error);
      toast.error(error?.message || "Failed to execute swap", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-b border-x-0 border-t-0 bg-background rounded-none p-0 gap-0">
      <CardContent className="p-0 gap-0 relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10"></div>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-20 border-b">
            <TabsTrigger className="" value="buy">
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy">
            <div className="flex justify-between items-center p-6">
              <span className="text-sm text-muted-foreground">balance:</span>
              <span className="text-sm">
                {balanceLoading
                  ? "Loading..."
                  : `${solBalance?.toFixed(6) || "0"} SOL`}
              </span>
            </div>

            <div className="relative">
              <Input
                className="w-full border-y pr-20 py-6 text-xl"
                id="buy-from"
                type="number"
                placeholder="0.0"
                value={buyAmount}
                onChange={(e) => handleBuyAmountChange(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <div className="flex items-center justify-center">
                  <Image
                    src={"/solana.svg"}
                    alt="Solana"
                    width={40}
                    height={40}
                  />
                </div>
              </div>
            </div>

            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-none py-8 border-0 border-r"
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
                className="flex-1 rounded-none py-8 border-0 border-r"
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
                className="flex-1 rounded-none py-8 border-0 border-r"
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
                className="flex-1 rounded-none py-8 border-0"
                onClick={() => {
                  const amount = solBalance || 0;
                  handleBuyAmountChange(amount.toString());
                }}
              >
                100%
              </Button>
            </div>

            {buyOutputAmount && (
              <div className="text-center py-4">
                <span className="text-muted-foreground">you receive </span>
                <span className="font-medium">
                  {buyOutputAmount} {TOKEN_SYMBOL}
                </span>
              </div>
            )}

            <Button
              onClick={handleBuy}
              className="w-full rounded-none py-8 text-lg"
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
            <div className="flex justify-between items-center p-6">
              <span className="text-sm text-muted-foreground">
                {TOKEN_SYMBOL} balance:
              </span>
              <span className="text-sm">0</span>
            </div>

            <div className="relative">
              <Input
                className="w-full border-y rounded-none pr-20 py-6 text-lg"
                id="sell-from"
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => handleSellAmountChange(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <span className="text-sm font-medium">{TOKEN_SYMBOL}</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs">P</span>
                </div>
              </div>
            </div>

            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-none py-8 border-0 border-r"
                onClick={() => handleSellAmountChange("0")}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-none py-8 border-0 border-r"
                onClick={() => handleSellAmountChange("0")}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-none py-8 border-0 border-r"
                onClick={() => handleSellAmountChange("0")}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-none py-8 border-0 border-r"
                onClick={() => handleSellAmountChange("0")}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-none py-8 border-0"
                onClick={() => handleSellAmountChange("0")}
              >
                100%
              </Button>
            </div>

            {sellOutputAmount && (
              <div className="text-center py-4">
                <span className="text-muted-foreground">you receive </span>
                <span className="font-medium">{sellOutputAmount} SOL</span>
              </div>
            )}

            <Button
              onClick={handleSell}
              className="w-full rounded-none py-8 text-lg"
              size="lg"
              variant="destructive"
              disabled={!wallet.connected || isLoading || !sellAmount}
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
