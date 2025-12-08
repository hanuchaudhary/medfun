import { useWallets as useWalletsSolana } from "@privy-io/react-auth/solana";
import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";

type WalletInfo = {
  address: string;
  type: "solana";
  name: string;
  icon?: string;
};

export function useWallet() {
  const { authenticated, ready, login, logout } = usePrivy();
  const { wallets: walletsSolana } = useWalletsSolana();

  const solanaWallets: WalletInfo[] = walletsSolana.map((wallet) => ({
    address: wallet.address,
    type: "solana" as const,
    name: (wallet as any).standardWallet.name,
    icon: (wallet as any).standardWallet.icon,
  }));

  const solanaWallet = useMemo(() => {
    return solanaWallets[0] || null;
  }, [solanaWallets]);

  const publicKey = useMemo(() => {
    if (!solanaWallet?.address) return null;
    try {
      return new PublicKey(solanaWallet.address);
    } catch (error) {
      console.error("Invalid public key:", error);
      return null;
    }
  }, [solanaWallet?.address]);

  return {
    publicKey,
    connected: authenticated && !!solanaWallet,
    connecting: !ready,
    disconnecting: false,
    wallet: solanaWallet,
    wallets: solanaWallets,
    connect: login,
    disconnect: logout,
    signTransaction: undefined, 
  };
}
