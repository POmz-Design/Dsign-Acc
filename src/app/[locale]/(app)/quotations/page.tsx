import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DocumentsClient } from "@/components/app/documents-client";
import { getDocuments } from "@/app/actions/documents";
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

  const docs = await getDocuments("quotation");
  return <DocumentsClient type="quotation" documents={docs} />;
}
