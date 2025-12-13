import { supabaseClient } from "./supabaseClient";

type RealtimeEvent = "INSERT" | "UPDATE";

interface SubscribeOptions {
  table: "holder" | "trade" | "kline";
  mintAddress: string;
  events?: RealtimeEvent[];
  callback: (payload: any) => void;
}

export function subscribeToTableChanges({
  table,
  mintAddress,
  events = ["INSERT", "UPDATE"],
  callback,
}: SubscribeOptions) {
  const channelName = `${table}:${mintAddress}:${Math.random()}`;
  let channel = supabaseClient.channel(channelName);
  events.forEach((event) => {
    channel = channel.on(
      "postgres_changes" as any,
      {
        event,
        schema: "public",
        table,
        filter: `tokenMintAddress=eq.${mintAddress}`,
      },
      callback
    );
  });

  channel.subscribe((status, err) => {
    console.log(`${table} channel status:`, status, err);
  });

  return channel;
}

export function subscribeToHolderChanges(callback: any, mintAddress: string) {
  return subscribeToTableChanges({
    table: "holder",
    mintAddress,
    callback,
  });
}
