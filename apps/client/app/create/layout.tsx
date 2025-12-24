import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Token",
  description:
    "Launch your own token on Solana in seconds. Create meme coins, community tokens, and more with med.fun's easy token creator.",
  openGraph: {
    title: "Create Token | med.fun",
    description:
      "Launch your own token on Solana in seconds. Create meme coins, community tokens, and more.",
  },
  twitter: {
    title: "Create Token | med.fun",
    description:
      "Launch your own token on Solana in seconds. Create meme coins, community tokens, and more.",
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
