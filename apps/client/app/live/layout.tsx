import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Streams",
  description:
    "Watch live token streams on med.fun. See real-time trading activity, community discussions, and token launches on Solana.",
  openGraph: {
    title: "Live Streams | med.fun",
    description:
      "Watch live token streams on med.fun. See real-time trading activity and token launches on Solana.",
  },
  twitter: {
    title: "Live Streams | med.fun",
    description:
      "Watch live token streams on med.fun. See real-time trading activity and token launches on Solana.",
  },
};

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
