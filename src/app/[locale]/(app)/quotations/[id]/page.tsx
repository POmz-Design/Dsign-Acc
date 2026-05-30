import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DocumentDetailClient } from "@/components/app/document-detail-client";
import { getDocument } from "@/app/actions/documents";
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

  const data = await getDocument(id);
  if (!data || data.document.type !== "quotation") notFound();

  return (
    <DocumentDetailClient document={data.document} lines={data.lines} />
  );
}
