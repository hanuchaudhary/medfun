import { supabaseClient } from "@/lib/supabaseClient";
import ChartLiveClient from "../coins/token/clients/ChartLiveClient";
import { Kline } from "@/types/token";

export async function ChartLiveWrapper({
  mintAddress,
}: {
  mintAddress: string;
}) {
  const {
    data: klines,
    error,
    statusText,
  } = await supabaseClient
    .from("kline")
    .select("*")
    .eq("tokenMintAddress", mintAddress)
    .order("timestamp", { ascending: true });

  return (
    <ChartLiveClient
      mintAddress={mintAddress}
      klines={(klines as Kline[]) || []}
    />
  );
}
