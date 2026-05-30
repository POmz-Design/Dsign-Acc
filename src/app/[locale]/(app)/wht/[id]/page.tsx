import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { WhtDetailClient } from "@/components/app/wht-detail-client";
import { getWhtCertificate } from "@/app/actions/wht";
import { requireCompany } from "@/lib/queries/company";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { company } = await requireCompany();
  if (!company) redirect(`/${locale}/settings?onboarding=1`);

  const certificate = await getWhtCertificate(id);
  if (!certificate) notFound();

  return <WhtDetailClient certificate={certificate} locale={locale} />;
}
