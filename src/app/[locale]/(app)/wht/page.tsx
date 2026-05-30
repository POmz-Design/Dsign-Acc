import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { WhtClient } from "@/components/app/wht-client";
import { getWhtCertificates } from "@/app/actions/wht";
import { requireCompany } from "@/lib/queries/company";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { company } = await requireCompany();
  if (!company) redirect(`/${locale}/settings?onboarding=1`);

  const certificates = await getWhtCertificates();
  return <WhtClient certificates={certificates} />;
}
