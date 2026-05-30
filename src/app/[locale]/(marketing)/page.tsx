import { setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/marketing/hero";
import { Services } from "@/components/marketing/services";
import { About } from "@/components/marketing/about";
import { Faq } from "@/components/marketing/faq";
import { Contact } from "@/components/marketing/contact";

export default async function MarketingHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Services />
      <About />
      <Faq />
      <Contact />
    </>
  );
}
