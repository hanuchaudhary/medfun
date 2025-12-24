import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Manage your tokens and view your portfolio on med.fun. Track your created tokens, holdings, and trading history on Solana.",
  openGraph: {
    title: "Profile | med.fun",
    description:
      "Manage your tokens and view your portfolio on med.fun. Track your created tokens and holdings on Solana.",
  },
  twitter: {
    title: "Profile | med.fun",
    description:
      "Manage your tokens and view your portfolio on med.fun. Track your created tokens and holdings on Solana.",
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
