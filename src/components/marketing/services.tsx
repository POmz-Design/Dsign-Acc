import { useTranslations } from "next-intl";
import {
  BookOpen,
  FileSpreadsheet,
  Calculator,
  ShieldCheck,
  Settings2,
  ClipboardList,
  TrendingUp,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SERVICE_KEYS = [
  "monthly",
  "annual",
  "taxAdvisor",
  "audit",
  "setup",
  "registration",
  "taxPlanning",
  "consulting",
] as const;

const ICONS: Record<(typeof SERVICE_KEYS)[number], LucideIcon> = {
  monthly: BookOpen,
  annual: FileSpreadsheet,
  taxAdvisor: Calculator,
  audit: ShieldCheck,
  setup: Settings2,
  registration: ClipboardList,
  taxPlanning: TrendingUp,
  consulting: MessagesSquare,
};

export function Services() {
  const t = useTranslations("Services");

  return (
    <section id="services" className="border-b py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("subheading")}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_KEYS.map((key) => {
            const Icon = ICONS[key];
            return (
              <Card key={key} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <Icon className="mb-3 h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">
                    {t(`items.${key}.title`)}
                  </CardTitle>
                  <CardDescription>{t(`items.${key}.desc`)}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
