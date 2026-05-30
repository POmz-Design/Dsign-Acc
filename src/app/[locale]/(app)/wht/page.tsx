import { setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlaceholderPage titleKey="wht" phase={3} />;
}
