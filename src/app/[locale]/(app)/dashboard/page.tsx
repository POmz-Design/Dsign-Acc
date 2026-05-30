import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats } from "@/lib/queries/dashboard";

function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations("App.dashboard");
  const stats = await getDashboardStats();

  const cards = [
    {
      key: "invoicesThisMonth" as const,
      primary: stats.invoicesCount.toString(),
      secondary: `${fmtMoney(stats.invoicesTotal)} THB`,
    },
    {
      key: "vatCollected" as const,
      primary: fmtMoney(stats.vatCollected),
      secondary: "THB",
    },
    {
      key: "whtWithheld" as const,
      primary: fmtMoney(stats.whtWithheld),
      secondary: "THB",
    },
    {
      key: "outstanding" as const,
      primary: fmtMoney(stats.outstanding),
      secondary: "THB",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {t("welcome")}
          {session?.user?.email ? `, ${session.user.email}` : ""}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ key, primary, secondary }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(key)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{primary}</p>
              <p className="text-xs text-muted-foreground">{secondary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
