import { useTranslations } from "next-intl";

export function About() {
  const t = useTranslations("About");

  return (
    <section id="about" className="border-b bg-muted/30 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {t("heading")}
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
