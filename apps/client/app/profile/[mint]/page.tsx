import ProfileDetailPage from "./ProfileDetailPage";

export default async function TokenManagePage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  return <ProfileDetailPage mint={mint} />;
}
