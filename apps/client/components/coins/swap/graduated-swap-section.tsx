"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicKey } from "@solana/web3.js";
import { CpAmm } from "@meteora-ag/cp-amm-sdk";
import BN from "bn.js";
import { toast } from "sonner";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useCurrentToken } from "../token/token-page-wrapper";
import bs58 from "bs58";
import {
  DAMM_V2_MIGRATION_FEE_ADDRESS,
  deriveDammV2PoolAddress,
  DynamicBondingCurveClient,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { updateGraduatedPoolAddress } from "@/lib/actions";
import { useSwap, useSwapInput, validateAmount } from "@/hooks/use-swap";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useSignAndSendTransaction as useSendTransactionSolana } from "@privy-io/react-auth/solana";

interface GraduatedSwapSectionProps {
  activeTab?: "buy" | "sell";
  onTabChange?: (tab: "buy" | "sell") => void;
}

export function GraduatedSwapSection({
  activeTab = "buy",
  onTabChange,
}: GraduatedSwapSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [graduatedPoolAddress, setGraduatedPoolAddress] = useState<
    string | null
  >(null);

  const current = useCurrentToken();
  const TOKEN_SYMBOL = current?.symbol || "TKN";
  const SLIPPAGE = 0.5;

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
  } = useSwap({ tokenMint: current?.mintAddress });

  const { signAndSendTransaction: sendTransactionSolana } =
    useSendTransactionSolana();

  const buyInput = useSwapInput();
  const sellInput = useSwapInput();

  const GRADUATED_POOL_ADDRESS = useMemo(() => {
    const addr = graduatedPoolAddress || current?.graduatedPoolAddress;
    if (!addr) return null;
    try {
      return new PublicKey(addr);
    } catch {
      return null;
    }
  }, [graduatedPoolAddress, current?.graduatedPoolAddress]);

  const cpAmm = useMemo(() => new CpAmm(connection), [connection]);

  useEffect(() => {
    if (current?.graduatedPoolAddress) return;
    if (!current?.mintAddress || !current?.poolAddress) return;

    const checkAndUpdateGraduatedPool = async () => {
      try {
        const dbcClient = new DynamicBondingCurveClient(
          connection,
          "confirmed"
        );
        const poolPubkey = new PublicKey(current.poolAddress);
        const tokenMintPubkey = new PublicKey(current.mintAddress);

        const virtualPoolState = await dbcClient.state.getPool(poolPubkey);
        if (!virtualPoolState) return;

        const poolConfigState = await dbcClient.state.getPoolConfig(
          virtualPoolState.config
        );

        const derivedPoolAddress = deriveDammV2PoolAddress(
          DAMM_V2_MIGRATION_FEE_ADDRESS[poolConfigState.migrationFeeOption]!,
          tokenMintPubkey,
          new PublicKey("So11111111111111111111111111111111111111112")
        );

        const derivedPoolAddressStr = derivedPoolAddress.toString();
        setGraduatedPoolAddress(derivedPoolAddressStr);
        const result = await updateGraduatedPoolAddress(
          current.mintAddress,
          derivedPoolAddressStr
        );

        if (result.success) {
          toast.success("Graduated pool address updated!");
        }
      } catch (error) {
        console.error("Error checking graduated pool:", error);
      }
    };

    checkAndUpdateGraduatedPool();
  }, [
    current?.mintAddress,
    current?.poolAddress,
    current?.graduatedPoolAddress,
    connection,
  ]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey && current?.mintAddress) {
      refetchTokenBalance();
    }
  }, [
    wallet.connected,
    wallet.publicKey,
    current?.mintAddress,
    refetchTokenBalance,
  ]);

  const getQuote = useCallback(
    async (amount: number, isBuy: boolean) => {
      if (!GRADUATED_POOL_ADDRESS) return null;
      try {
        const poolState = await cpAmm.fetchPoolState(GRADUATED_POOL_ADDRESS);
        if (!poolState) return null;

        const currentSlot = await connection.getSlot();
        const blockTime = await connection.getBlockTime(currentSlot);
        if (blockTime === null) return null;

        const amountIn = new BN(Math.floor(amount * (isBuy ? 1e9 : 1e6)));
        const inputMint = isBuy ? poolState.tokenAMint : poolState.tokenBMint;

        const quote = await cpAmm.getQuote({
          inAmount: amountIn,
          inputTokenMint: inputMint,
          slippage: SLIPPAGE,
          poolState,
          currentTime: blockTime,
          currentSlot,
          tokenADecimal: 9,
          tokenBDecimal: 6,
        });

        return {
          quote,
          poolState,
          outputAmount:
            parseFloat(quote.swapOutAmount.toString()) / (isBuy ? 1e6 : 1e9),
        };
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        return null;
      }
    },
    [GRADUATED_POOL_ADDRESS, connection, cpAmm]
  );

  const fetchBuyQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        buyInput.setOutputAmount("");
        return;
      }
      buyInput.setIsFetchingQuote(true);
      try {
        const result = await getQuote(parseFloat(amount), true);
        if (result !== null) {
          buyInput.setOutputAmount(result.outputAmount.toFixed(6));
        }
      } catch {
        buyInput.setOutputAmount("");
      } finally {
        buyInput.setIsFetchingQuote(false);
      }
    },
    [getQuote, buyInput]
  );

  const fetchSellQuote = useCallback(
    async (amount: string) => {
      if (!amount || parseFloat(amount) <= 0) {
        sellInput.setOutputAmount("");
        return;
      }
      sellInput.setIsFetchingQuote(true);
      try {
        const result = await getQuote(parseFloat(amount), false);
        if (result !== null) {
          sellInput.setOutputAmount(result.outputAmount.toFixed(6));
        }
      } catch {
        sellInput.setOutputAmount("");
      } finally {
        sellInput.setIsFetchingQuote(false);
      }
    },
    [getQuote, sellInput]
  );

  const handleBuyAmountChange = (value: string) => {
    buyInput.handleAmountChange(value, fetchBuyQuote);
  };

  const handleSellAmountChange = (value: string) => {
    sellInput.handleAmountChange(value, fetchSellQuote);
  };

  const handleBuy = async () => {
    if (!validateAmount(buyInput.amount)) return;
    if (!validateWallet()) return;
    if (!GRADUATED_POOL_ADDRESS) {
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
      toast.loading("Getting swap quote...", { id: toastId });
      const result = await getQuote(parseFloat(buyInput.amount), true);
      if (!result) {
        toast.error("Failed to get quote", { id: toastId });
        return;
      }

      const { quote, poolState } = result;
      const amountIn = new BN(Math.floor(parseFloat(buyInput.amount) * 1e9));

      toast.loading("Creating swap transaction...", { id: toastId });

      const swapTx = await cpAmm.swap({
        payer: wallet.publicKey!,
        pool: GRADUATED_POOL_ADDRESS,
        inputTokenMint: poolState.tokenAMint,
        outputTokenMint: poolState.tokenBMint,
        amountIn,
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
      swapTx.feePayer = wallet.publicKey!;

      toast.loading("Awaiting confirmation...", { id: toastId });

      const txBase64 = swapTx
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");

      const txResult = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const signature = bs58.encode(txResult.signature);

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
    if (!GRADUATED_POOL_ADDRESS) {
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
      toast.loading("Getting swap quote...", { id: toastId });
      const result = await getQuote(parseFloat(sellInput.amount), false);
      if (!result) {
        toast.error("Failed to get quote", { id: toastId });
        return;
      }

      const { quote, poolState } = result;
      const amountIn = new BN(Math.floor(parseFloat(sellInput.amount) * 1e6));

      toast.loading("Creating swap transaction...", { id: toastId });

      const swapTx = await cpAmm.swap({
        payer: wallet.publicKey!,
        pool: GRADUATED_POOL_ADDRESS,
        inputTokenMint: poolState.tokenBMint,
        outputTokenMint: poolState.tokenAMint,
        amountIn,
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
      swapTx.feePayer = wallet.publicKey!;

      toast.loading("Awaiting confirmation...", { id: toastId });

      const txBase64 = swapTx
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");

      const txResult = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });
      const signature = bs58.encode(txResult.signature);

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
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange?.(v as "buy" | "sell")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
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
                    src={current?.imageUrl!}
                    alt={current?.name || "Token Image"}
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

export default GraduatedSwapSection;
