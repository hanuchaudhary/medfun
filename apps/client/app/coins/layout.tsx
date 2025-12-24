import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Tokens",
  description:
    "Browse all tokens launched on med.fun. Discover trending Solana meme coins, new launches, and top performers.",
  openGraph: {
    title: "All Tokens | med.fun",
    description:
      "Browse all tokens launched on med.fun. Discover trending Solana meme coins and new launches.",
  },
  twitter: {
    title: "All Tokens | med.fun",
    description:
      "Browse all tokens launched on med.fun. Discover trending Solana meme coins and new launches.",
  },
};

export default function CoinsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
