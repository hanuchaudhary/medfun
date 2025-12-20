"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  useSignAndSendTransaction as useSendTransactionSolana,
  useWallets as useWalletsSolana,
} from "@privy-io/react-auth/solana";
import { useWallet } from "@/hooks/use-wallet";
import { useBalance } from "@/hooks/use-balance";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { toast } from "sonner";
import bs58 from "bs58";

interface UseSwapOptions {
  tokenMint?: string;
  refetchInterval?: number;
}

export function useSwap({
  tokenMint,
  refetchInterval = 30000,
}: UseSwapOptions = {}) {
  const wallet = useWallet();
  const { wallets: walletsSolana } = useWalletsSolana();
  const { signAndSendTransaction: sendTransactionSolana } =
    useSendTransactionSolana();

  const connection = useMemo(() => {
    return new Connection(process.env.NEXT_PUBLIC_RPC_URL!, "confirmed");
  }, []);

  const { balance: solBalance, isLoading: solBalanceLoading } = useBalance({
    publicKey: wallet.publicKey,
    refetchInterval,
  });

  const {
    balance: tokenBalance,
    isLoading: tokenBalanceLoading,
    refetch: refetchTokenBalance,
  } = useTokenBalance({
    owner: wallet.publicKey?.toString(),
    mint: tokenMint,
  });

  const getPrivyWallet = useCallback(() => {
    if (!wallet.wallet?.address) return null;
    return walletsSolana.find((w) => w.address === wallet.wallet?.address);
  }, [wallet.wallet?.address, walletsSolana]);

  const validateWallet = useCallback(() => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return false;
    }

    const privyWallet = getPrivyWallet();
    if (!privyWallet) {
      toast.error("Could not find the selected Solana wallet");
      return false;
    }

    return true;
  }, [wallet.connected, wallet.publicKey, getPrivyWallet]);

  const sendTransaction = useCallback(
    async (transaction: Transaction, toastId: string | number) => {
      const privyWallet = getPrivyWallet();
      if (!privyWallet) {
        throw new Error("Could not find the selected Solana wallet");
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = wallet.publicKey!;

      toast.loading("Awaiting confirmation...", { id: toastId });

      const txBase64 = transaction
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64");

      const result = await sendTransactionSolana({
        transaction: Buffer.from(txBase64, "base64"),
        wallet: privyWallet,
      });

      const signature = bs58.encode(result.signature);
      return signature;
    },
    [connection, wallet.publicKey, getPrivyWallet, sendTransactionSolana]
  );

  const showSuccessToast = useCallback(
    (signature: string, toastId: string | number) => {
      toast.success("Swap successful!", {
        id: toastId,
        duration: 5000,
        description: `Transaction: ${signature.slice(0, 8)}...`,
        action: {
          label: "View on Solscan",
          onClick: () =>
            window.open(
              `https://solscan.io/tx/${signature}?cluster=devnet`,
              "_blank"
            ),
        },
      });
    },
    []
  );

  const showErrorToast = useCallback((error: any, toastId: string | number) => {
    const message = error?.message || "Failed to execute swap";
    toast.error(message, { id: toastId });
  }, []);

  return {
    connection,
    wallet,
    solBalance,
    solBalanceLoading,
    tokenBalance,
    tokenBalanceLoading,
    refetchTokenBalance,
    getPrivyWallet,
    validateWallet,
    sendTransaction,
    showSuccessToast,
    showErrorToast,
  };
}

export function useSwapInput() {
  const [amount, setAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleAmountChange = useCallback(
    (value: string, fetchQuote: (amount: string) => Promise<void>) => {
      setAmount(value);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (value && parseFloat(value) > 0) {
        debounceTimer.current = setTimeout(() => {
          fetchQuote(value);
        }, 500);
      } else {
        setOutputAmount("");
      }
    },
    []
  );

  const clearAmount = useCallback(() => {
    setAmount("");
    setOutputAmount("");
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    amount,
    outputAmount,
    isFetchingQuote,
    setAmount,
    setOutputAmount,
    setIsFetchingQuote,
    handleAmountChange,
    clearAmount,
  };
}

export function validateAmount(amount: string): boolean {
  if (!amount || parseFloat(amount) <= 0) {
    toast.error("Please enter a valid amount");
    return false;
  }
  return true;
}
