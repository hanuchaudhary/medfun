import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Decimal from "decimal.js";

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

const SOL_MINT = "So11111111111111111111111111111111111111112";

function parseMeteoraWebhook(
  payload: WebhookTransaction[]
): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  for (const tx of payload) {
    try {
      const { signature, timestamp, slot, feePayer, tokenTransfers } = tx;
      const solTransfers = tokenTransfers.filter((t) => t.mint === SOL_MINT);
      const tokenTransfersNonSol = tokenTransfers.filter(
        (t) => t.mint !== SOL_MINT
      );

      if (!solTransfers.length || !tokenTransfersNonSol.length) {
        continue;
      }

      const solLeg = solTransfers.reduce((a, b) =>
        Math.abs(a.tokenAmount) > Math.abs(b.tokenAmount) ? a : b
      );

      const tokenLeg = tokenTransfersNonSol.reduce((a, b) =>
        Math.abs(a.tokenAmount) > Math.abs(b.tokenAmount) ? a : b
      );

      const isBuy = solLeg.fromUserAccount === feePayer;

      const type: "BUY" | "SELL" = isBuy ? "BUY" : "SELL";

      const tokenAmount = new Decimal(tokenLeg.tokenAmount);
      const solAmount = new Decimal(solLeg.tokenAmount);

      if (tokenAmount.lte(0) || solAmount.lte(0)) continue;

      const price = solAmount.div(tokenAmount);

      results.push({
        type,
        signature,
        traderAddress: feePayer,
        tokenMint: tokenLeg.mint,
        tokenAmount: tokenAmount.toNumber(),
        solAmount: solAmount.toNumber(),
        price: price.toNumber(),
        timestamp,
        slot,
      });
    } catch (e) {
      console.error("Parse error:", tx.signature, e);
    }
  }

  return results;
}

export { parseMeteoraWebhook, type WebhookTransaction, type ParsedTransaction };

export function get1mBucket(unixSeconds: number) {
  return new Date(Math.floor(unixSeconds / 60) * 60 * 1000);
}
