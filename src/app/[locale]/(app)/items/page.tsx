import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { ItemsClient } from "@/components/app/items-client";
import { getItems } from "@/app/actions/items";
import { requireCompany } from "@/lib/queries/company";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { company } = await requireCompany();
  if (!company) {
    redirect(`/${locale}/settings?onboarding=1`);
  }

  const items = await getItems();
  return <ItemsClient items={items} />;
}
