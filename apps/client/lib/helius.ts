import { Address } from "@solana/kit";
import { createHelius } from "helius-sdk";

const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY!
console.log("API Key, as loaded in helius.ts:", apiKey);
export const heliusClient = createHelius({ apiKey });


export async function getTokenBalance(owner: Address, mint: Address): Promise<number> {
  const result = await heliusClient.getTokenAccountsByOwner(owner,{
    mint: mint
  })

  if (!result.value.length) return 0;

  const account = result.value[0];
  const amount = Number(account?.account?.data);
  const decimals = Number(account?.account?.data);

  return amount / Math.pow(10, decimals);
}