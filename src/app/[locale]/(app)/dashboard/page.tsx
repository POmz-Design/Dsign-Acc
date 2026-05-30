import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations("App.dashboard");

  const STATS = [
    { key: "invoicesThisMonth" as const },
    { key: "vatCollected" as const },
    { key: "whtWithheld" as const },
    { key: "outstanding" as const },
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
        {STATS.map(({ key }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(key)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
