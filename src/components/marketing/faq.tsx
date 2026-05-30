import { useTranslations } from "next-intl";

const QUESTIONS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

export function Faq() {
  const t = useTranslations("Faq");

  return (
    <section id="faq" className="border-b py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {t("heading")}
          </h2>

          <div className="mt-10 space-y-4">
            {QUESTIONS.map((key) => (
              <details
                key={key}
                className="group rounded-lg border bg-background p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  <span>{t(`items.${key}.q`)}</span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground">
                  {t(`items.${key}.a`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
