import ProfileDetailPage from "./ProfileDetailPage";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mint: string }>;
}): Promise<Metadata> {
  const { mint } = await params;
  return {
    title: `Manage Token ${mint.slice(0, 8)}...`,
    description: `Manage and configure your token ${mint} on med.fun - update settings, view analytics, and more.`,
    openGraph: {
      title: `Manage Token | med.fun`,
      description: `Manage and configure your token on med.fun.`,
    },
  };
}

export default async function TokenManagePage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  return <ProfileDetailPage mint={mint} />;
}
