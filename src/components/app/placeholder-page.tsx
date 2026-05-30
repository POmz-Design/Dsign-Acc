import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function PlaceholderPage({
  titleKey,
  phase,
}: {
  titleKey:
    | "quotations"
    | "invoices"
    | "receipts"
    | "wht"
    | "taxEstimator"
    | "customers"
    | "items"
    | "settings";
  phase: number;
}) {
  const tPages = await getTranslations("App.pages");
  const tPlaceholder = await getTranslations("App.placeholder");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">{tPages(titleKey)}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tPlaceholder("comingSoon")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {tPlaceholder("phase", { phase })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
