import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { CustomersClient } from "@/components/app/customers-client";
import { getCustomers } from "@/app/actions/customers";
import { requireCompany } from "@/lib/queries/company";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Onboarding guard: if the user hasn't filled out company info yet, push
  // them to /settings with a banner. We chose this per-page guard (instead of
  // a single layout-level check) to avoid duplicate `auth()` round-trips and
  // because Next 15's layout can't read `searchParams`. See CLAUDE design note.
  const { company } = await requireCompany();
  if (!company) {
    redirect(`/${locale}/settings?onboarding=1`);
  }

  const customers = await getCustomers();
  return <CustomersClient customers={customers} />;
}
