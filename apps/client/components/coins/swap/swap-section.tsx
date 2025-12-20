"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DynamicBondingCurveClient,
  getCurrentPoint,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { useSignAndSendTransaction as useSendTransactionSolana } from "@privy-io/react-auth/solana";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import bs58 from "bs58";
import { toast } from "sonner";
import Image from "next/image";
import { useCurrentToken } from "../token/token-page-wrapper";
import { Loader2 } from "lucide-react";
import { useSwap, useSwapInput, validateAmount } from "@/hooks/use-swap";

interface SwapSectionProps {
  tokenmint: string;
}

export function SwapSection({ tokenmint }: SwapSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const currentToken = useCurrentToken();
  const SLIPPAGE_BPS = 100;

  const {
    connection,
    wallet,
    solBalance,
    solBalanceLoading,
    tokenBalance,
    tokenBalanceLoading,
    refetchTokenBalance,
    getPrivyWallet,
    validateWallet,
    showSuccessToast,
    showErrorToast,
  } = useSwap({ tokenMint: tokenmint });

  const { signAndSendTransaction: sendTransactionSolana } =
    useSendTransactionSolana();

  const buyInput = useSwapInput();
  const sellInput = useSwapInput();

  const POOL_ADDRESS = useMemo(() => {
    if (!currentToken?.poolAddress) return null;
    try {
      return new PublicKey(currentToken.poolAddress);
    } catch {
      return null;
    }
  }, [currentToken?.poolAddress]);

  const TOKEN_SYMBOL = currentToken?.symbol;

  const getSwapQuote = useCallback(
    async (amount: number, isBuy: boolean) => {
      if (!POOL_ADDRESS) {
        throw new Error("Pool address not available");
      }
      const client = new DynamicBondingCurveClient(connection, "confirmed");
      const virtualPoolState = await client.state.getPool(POOL_ADDRESS);
      const poolConfigState = await client.state.getPoolConfig(
        virtualPoolState.config
      );
      const currentPoint = await getCurrentPoint(
        connection,
        poolConfigState.activationType
      );

      const decimals = isBuy ? 9 : 6;
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
          parseFloat(quote.outputAmount.toString()) /
          Math.pow(10, isBuy ? 6 : 9),
      };
    },
    [POOL_ADDRESS, connection]
  );

  const fetchBuyQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        buyInput.setOutputAmount("");
        return;
      }
      if (!POOL_ADDRESS) return;
      buyInput.setIsFetchingQuote(true);
      try {
        const { outputAmount } = await getSwapQuote(parseFloat(amount), true);
        buyInput.setOutputAmount(outputAmount.toFixed(9));
      } catch {
        buyInput.setOutputAmount("");
      } finally {
        buyInput.setIsFetchingQuote(false);
      }
    },
    [POOL_ADDRESS, getSwapQuote, buyInput]
  );

  const fetchSellQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        sellInput.setOutputAmount("");
        return;
      }
      if (!POOL_ADDRESS) return;
      sellInput.setIsFetchingQuote(true);
      try {
        const { outputAmount } = await getSwapQuote(parseFloat(amount), false);
        sellInput.setOutputAmount(outputAmount.toFixed(9));
      } catch {
        sellInput.setOutputAmount("");
      } finally {
        sellInput.setIsFetchingQuote(false);
      }
    },
    [POOL_ADDRESS, getSwapQuote, sellInput]
  );

  const handleBuyAmountChange = (value: string) => {
    buyInput.handleAmountChange(value, fetchBuyQuote);
  };

  const handleSellAmountChange = (value: string) => {
    sellInput.handleAmountChange(value, fetchSellQuote);
  };

  useEffect(() => {
    if (wallet.connected && wallet.publicKey && tokenmint) {
      refetchTokenBalance();
    }
  }, [wallet.connected, wallet.publicKey, tokenmint, refetchTokenBalance]);

  const handleBuy = async () => {
    if (!validateAmount(buyInput.amount)) return;
    if (!validateWallet()) return;
    if (!POOL_ADDRESS) {
      toast.error("Pool address not available. Please try again.");
      return;
    }

    const privyWallet = getPrivyWallet();
    if (!privyWallet) {
      toast.error("Could not find the selected Solana wallet");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing swap transaction...");

    try {
      const client = new DynamicBondingCurveClient(connection, "confirmed");

      toast.loading("Getting swap quote...", { id: toastId });
      const { quote } = await getSwapQuote(parseFloat(buyInput.amount), true);

      const swapParam = {
        amountIn: new BN(Math.floor(parseFloat(buyInput.amount) * 1e9)),
        minimumAmountOut: quote.minimumAmountOut,
        swapBaseForQuote: false,
        owner: wallet.publicKey!,
        pool: POOL_ADDRESS,
        referralTokenAccount: null,
      };

      toast.loading("Creating swap transaction...", { id: toastId });
      const swapTransaction = await client.pool.swap(swapParam);

      const { blockhash } = await connection.getLatestBlockhash();
      swapTransaction.recentBlockhash = blockhash;
      swapTransaction.feePayer = wallet.publicKey!;

      toast.loading("Awaiting confirmation...", { id: toastId });

      const txBase64 = swapTransaction
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");

      const result = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const signature = bs58.encode(result.signature);

      showSuccessToast(signature, toastId);
      buyInput.clearAmount();
      await refetchTokenBalance();
    } catch (error: any) {
      console.error("Swap failed:", error);
      showErrorToast(error, toastId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!validateAmount(sellInput.amount)) return;
    if (!validateWallet()) return;
    if (!POOL_ADDRESS) {
      toast.error("Pool address not available. Please try again.");
      return;
    }

    const privyWallet = getPrivyWallet();
    if (!privyWallet) {
      toast.error("Could not find the selected Solana wallet");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing swap transaction...");

    try {
      const client = new DynamicBondingCurveClient(connection, "confirmed");

      toast.loading("Getting swap quote...", { id: toastId });
      const { quote } = await getSwapQuote(parseFloat(sellInput.amount), false);

      const swapParam = {
        amountIn: new BN(parseFloat(sellInput.amount) * 1e6),
        minimumAmountOut: quote.minimumAmountOut,
        swapBaseForQuote: true,
        owner: wallet.publicKey!,
        pool: POOL_ADDRESS,
        referralTokenAccount: null,
      };

      toast.loading("Creating swap transaction...", { id: toastId });
      const swapTransaction = await client.pool.swap(swapParam);

      const { blockhash } = await connection.getLatestBlockhash();
      swapTransaction.recentBlockhash = blockhash;
      swapTransaction.feePayer = wallet.publicKey!;

      toast.loading("Awaiting confirmation...", { id: toastId });

      const txBase64 = swapTransaction
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");

      const result = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const signature = bs58.encode(result.signature);

      showSuccessToast(signature, toastId);
      sellInput.clearAmount();
      await refetchTokenBalance();
    } catch (error: any) {
      console.error("Swap failed:", error);
      showErrorToast(error, toastId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-background gap-0 p-4">
      <CardContent className="p-0 gap-0 relative">
        <Tabs defaultValue="buy" className="w-full">
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
                {solBalanceLoading
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
                value={buyInput.amount}
                onChange={(e) => handleBuyAmountChange(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <div className="flex items-center justify-center">
                  <Image
                    src={"/solana.svg"}
                    alt="Solana"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
            </div>

            <div className="flex py-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() =>
                  handleBuyAmountChange(((solBalance || 0) * 0.25).toString())
                }
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() =>
                  handleBuyAmountChange(((solBalance || 0) * 0.5).toString())
                }
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() =>
                  handleBuyAmountChange(((solBalance || 0) * 0.75).toString())
                }
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border"
                onClick={() =>
                  handleBuyAmountChange((solBalance || 0).toString())
                }
              >
                100%
              </Button>
            </div>
            <div className="flex items-center justify-center">
              {buyInput.isFetchingQuote ? (
                <div className="text-center py-2 text-sm text-muted-foreground flex items-center justify-center mb-2">
                  <Loader2 className="w-4 h-4 mr-2 inline-block animate-spin" />{" "}
                  Loading quote...
                </div>
              ) : buyInput.outputAmount ? (
                <div className="text-center py-2 text-sm mb-2">
                  <span className="text-muted-foreground">you receive </span>
                  <span className="font-semibold text-primary">
                    {buyInput.outputAmount} {TOKEN_SYMBOL}
                  </span>
                </div>
              ) : null}
            </div>

            <Button
              onClick={handleBuy}
              className="w-full text-background font-semibold"
              size="lg"
              disabled={
                !wallet.connected ||
                isLoading ||
                !buyInput.amount ||
                parseFloat(buyInput.amount) <= 0
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
              <span className="text-sm">
                {tokenBalanceLoading
                  ? "Loading..."
                  : `${tokenBalance?.toFixed(6) || "0"} ${TOKEN_SYMBOL}`}
              </span>
            </div>

            <div className="relative">
              <Input
                className="w-full border rounded-xl pr-20 py-3"
                id="sell-from"
                type="number"
                placeholder="0.0"
                value={sellInput.amount}
                onChange={(e) => handleSellAmountChange(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image
                    priority
                    className="w-auto h-auto"
                    src={currentToken?.imageUrl!}
                    alt={currentToken?.name || "Token Image"}
                    width={32}
                    height={32}
                  />
                </div>
              </div>
            </div>

            <div className="flex py-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() =>
                  handleSellAmountChange(
                    ((tokenBalance || 0) * 0.25).toString()
                  )
                }
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() =>
                  handleSellAmountChange(((tokenBalance || 0) * 0.5).toString())
                }
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border border-r"
                onClick={() =>
                  handleSellAmountChange(
                    ((tokenBalance || 0) * 0.75).toString()
                  )
                }
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-sm border"
                onClick={() =>
                  handleSellAmountChange((tokenBalance || 0).toString())
                }
              >
                100%
              </Button>
            </div>

            <div className="flex items-center justify-center">
              {sellInput.isFetchingQuote ? (
                <div className="text-center py-2 text-sm text-muted-foreground flex items-center justify-center mb-2">
                  <Loader2 className="w-4 h-4 mr-2 inline-block animate-spin" />{" "}
                  Loading quote...
                </div>
              ) : sellInput.outputAmount ? (
                <div className="text-center py-2 text-sm mb-2">
                  <span className="text-muted-foreground">you receive </span>
                  <span className="font-medium">
                    {sellInput.outputAmount} SOL
                  </span>
                </div>
              ) : null}
            </div>

            <Button
              onClick={handleSell}
              className="w-full text-background"
              size="lg"
              variant="destructive"
              disabled={
                !wallet.connected ||
                isLoading ||
                !sellInput.amount ||
                parseFloat(sellInput.amount) <= 0
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
