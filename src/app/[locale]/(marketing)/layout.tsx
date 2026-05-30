import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
