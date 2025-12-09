"use client";

import dynamic from "next/dynamic";

const LiveStreamComponent = dynamic(
  () => import("@/components/live/live-stream-component"),
  { ssr: false }
);

export default function LivePage() {
  return <LiveStreamComponent channelId="1223" isCreator={true} key={""} />;
}
