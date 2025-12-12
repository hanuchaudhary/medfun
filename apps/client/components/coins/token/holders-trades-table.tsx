import { supabaseClient } from "@/lib/supabaseClient";
import HolderTradeClient from "./clients/HolderTradeClient";
import { Holder, Trade } from "@/types/token";

export async function HoldersTradesTable({
  mintAddress,
}: {
  mintAddress: string;
}) {
  const {
    data: trades,
    error,
    statusText,
    count,
  } = await supabaseClient
    .from("trade")
    .select("*")
    .eq("tokenMintAddress", mintAddress)
    .order("timestamp", { ascending: false })
    .limit(50);

  const {
    data: holders,
    error: holdersError,
    statusText: holdersStatusText,
    count: holdersCount,
  } = await supabaseClient
    .from("holder")
    .select("*")
    .eq("tokenMintAddress", mintAddress)
    .order("amount", { ascending: false })
    .limit(20);

  // console.log({
  //   holders,
  //   holdersCount,
  // });
  

  return (
    <HolderTradeClient
      mintAddress={mintAddress}
      holders={holders as Holder[]}
      trades={trades as Trade[]}
    />
  );
}
