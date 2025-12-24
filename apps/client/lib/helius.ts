import { Address } from "@solana/kit";
import { createHelius } from "helius-sdk";

const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY!;
export const heliusClient = createHelius({ apiKey });

export async function getTokenBalance(
  owner: Address,
  mint: Address
): Promise<number> {
  const result = await heliusClient.getTokenAccountsByOwner(
    owner,
    {
      mint: mint,
    },
    {
      commitment: "confirmed",
      encoding: "jsonParsed",
    }
  );
  // console.log("result: ", result);

  const account = result.value[0]?.account.data;
  const amount = (account as any)?.parsed?.info.tokenAmount.uiAmount;

  return amount
}
