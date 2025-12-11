import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface RawTokenAmount {
  decimals: number;
  tokenAmount: string;
}

interface TokenBalanceChange {
  mint: string;
  rawTokenAmount: RawTokenAmount;
  tokenAccount: string;
  userAccount: string;
}

interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

interface TokenTransfer {
  fromTokenAccount: string;
  fromUserAccount: string;
  mint: string;
  toTokenAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  tokenStandard: string;
}

interface WebhookTransaction {
  accountData: AccountData[];
  description: string;
  events: Record<string, any>;
  fee: number;
  feePayer: string;
  instructions: any[];
  nativeTransfers: any[];
  signature: string;
  slot: number;
  source: string;
  timestamp: number;
  tokenTransfers: TokenTransfer[];
  transactionError: null | string;
  type: string;
}

interface ParsedTransaction {
  type: "BUY" | "SELL";
  signature: string;
  traderAddress: string;
  tokenMint: string;
  tokenAmount: number;
  solAmount: number;
  price: number;
  timestamp: number;
  slot: number;
}


function parseMeteoraWebhook(payload: WebhookTransaction[]): ParsedTransaction[] {
  const SOL_MINT = "So11111111111111111111111111111111111111112";

  return payload.map((tx) => {
    const { signature, timestamp, slot, feePayer, tokenTransfers } = tx;

    const tokenTransfer = tokenTransfers.find((t) => t.mint !== SOL_MINT);
    const solTransfer = tokenTransfers.find((t) => t.mint === SOL_MINT);

    if (!tokenTransfer || !solTransfer) {
      throw new Error("Invalid transaction: missing token or SOL transfer");
    }

    const isBuy = solTransfer.fromUserAccount === feePayer;

    const type: "BUY" | "SELL" = isBuy ? "BUY" : "SELL";

    const tokenAmount = Number(tokenTransfer.tokenAmount); 
    const solAmount = Number(solTransfer.tokenAmount);     

    const price = tokenAmount > 0 ? solAmount / tokenAmount : 0;

    return {
      type,
      signature,
      traderAddress: feePayer,
      tokenMint: tokenTransfer.mint,
      tokenAmount,
      solAmount,
      price,
      timestamp,
      slot,
    };
  });
}


export {
  parseMeteoraWebhook,
  type WebhookTransaction,
  type ParsedTransaction,
};


export function get1mBucket(dateUnix: number) {
  return new Date(Math.floor(dateUnix / 60) * 60 * 1000);
}
