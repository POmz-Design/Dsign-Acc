"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { WhtCertificateRow } from "@/lib/db/schema";

type Props = {
  certificates: WhtCertificateRow[];
};

const STATUS_CLASSES: Record<string, string> = {
  issued: "bg-blue-100 text-blue-700",
  void: "bg-rose-100 text-rose-700",
};

function fmt(n: string | number): string {
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function WhtClient({ certificates }: Props) {
  const t = useTranslations("Wht");
  const tDoc = useTranslations("Documents");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/wht/new">
            <Plus className="h-4 w-4" />
            <span className="ml-2">{t("newButton")}</span>
          </Link>
        </Button>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-lg border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.runningNumber")}</TableHead>
                <TableHead>{t("table.formType")}</TableHead>
                <TableHead>{t("table.payee")}</TableHead>
                <TableHead>{t("table.paymentDate")}</TableHead>
                <TableHead className="text-right">{t("table.gross")}</TableHead>
                <TableHead className="text-right">{t("table.withheld")}</TableHead>
                <TableHead>{tDoc("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificates.map((c) => {
                const snap = c.customerSnapshot as { name: string };
                return (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link
                        href={`/wht/${c.id}`}
                        className="hover:underline"
                      >
                        {c.runningNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {c.formType === "pnd3" ? t("formPnd3Short") : t("formPnd53Short")}
                    </TableCell>
                    <TableCell>{snap?.name ?? "—"}</TableCell>
                    <TableCell>{c.paymentDate}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(c.totalGross)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(c.totalWithheld)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_CLASSES[c.status] ?? STATUS_CLASSES.issued,
                        )}
                      >
                        {t(`status.${c.status}`)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
