"use client";

//TODO: SOL balance

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/use-wallet";
import {
  useSignAndSendTransaction as useSendTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { CpAmm } from "@meteora-ag/cp-amm-sdk";
import BN from "bn.js";
import { toast } from "sonner";
import { TOKEN_GRADUATION_ADDRESS } from "@/app/constant";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useQuery } from "@tanstack/react-query";

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
  const [isLoading, setIsLoading] = useState(false);

  const GRADUATED_POOL_ADDRESS = TOKEN_GRADUATION_ADDRESS;

  const TOKEN_SYMBOL = "TKN";
  const SLIPPAGE = 0.5;

  const wallet = useWallet();
  const { wallets: walletsSolana } = useWalletsSolana();
  const { signAndSendTransaction: sendTransactionSolana } = useSendTransactionSolana();
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL!,
    "confirmed"
  );

  const cpAmm = new CpAmm(connection);

  const getPrivyWallet = () => {
    if (!wallet.wallet?.address) return null;
    return walletsSolana.find((w) => w.address === wallet.wallet?.address);
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

    const txBase64 = swapTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
    const result = await sendTransactionSolana({
      transaction: Buffer.from(txBase64, "base64"),
      wallet: privyWallet,
    });
    const signature = result.signature;

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
          <TabsList className="grid w-full grid-cols-2 h-20">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy" className="space-y-4 p-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">balance:</span>
              {/* <span className="text-sm">
                {balanceLoading
                  ? "Loading..."
                  : `${solBalance?.toFixed(6) || "0"} SOL`}
              </span> */}
            </div>

            <div className="relative">
              <Input
                className="w-full border rounded-lg pr-20 py-6 text-lg"
                id="buy-from"
                type="number"
                placeholder="0.0"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <span className="text-sm font-medium">SOL</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs">◎</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                // onClick={() => {
                //   const amount = (solBalance || 0) * 0.25;
                //   setBuyAmount(amount.toString());
                // }}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                // onClick={() => {
                //   const amount = (solBalance || 0) * 0.5;
                //   setBuyAmount(amount.toString());
                // }}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                // onClick={() => {
                //   const amount = (solBalance || 0) * 0.75;
                //   setBuyAmount(amount.toString());
                // }}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                // onClick={() => {
                //   const amount = solBalance || 0;
                //   setBuyAmount(amount.toString());
                // }}
              >
                100%
              </Button>
            </div>

            <Button
              onClick={handleBuy}
              className="w-full rounded-lg py-6 text-lg"
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

          <TabsContent value="sell" className="space-y-4 p-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {TOKEN_SYMBOL} balance:
              </span>
              <span className="text-sm">0</span>
            </div>

            <div className="relative">
              <Input
                className="w-full border rounded-lg pr-20 py-6 text-lg"
                id="sell-from"
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
              />
              <div className="flex items-center gap-2 absolute top-1/2 right-3 -translate-y-1/2">
                <span className="text-sm font-medium">{TOKEN_SYMBOL}</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs">T</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => setSellAmount("")}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => setSellAmount("0")}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => setSellAmount("0")}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => setSellAmount("0")}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg"
                onClick={() => setSellAmount("0")}
              >
                100%
              </Button>
            </div>

            <Button
              onClick={handleSell}
              className="w-full rounded-lg py-6 text-lg"
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
