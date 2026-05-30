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
import type { DocType, DocumentRow } from "@/lib/db/schema";

type Props = {
  type: DocType;
  documents: DocumentRow[];
};

const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  void: "bg-rose-100 text-rose-700",
};

function fmt(n: string | number): string {
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DocumentsClient({ type, documents }: Props) {
  const t = useTranslations(
    type === "quotation"
      ? "Quotations"
      : type === "invoice"
        ? "Invoices"
        : "Receipts",
  );
  const tDoc = useTranslations("Documents");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href={`/${type}s/new`}>
            <Plus className="h-4 w-4" />
            <span className="ml-2">{t("newButton")}</span>
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tDoc("table.runningNumber")}</TableHead>
                <TableHead>{tDoc("table.customer")}</TableHead>
                <TableHead>{tDoc("table.issueDate")}</TableHead>
                <TableHead className="text-right">{tDoc("table.total")}</TableHead>
                <TableHead>{tDoc("table.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => {
                const snap = d.customerSnapshot as { name: string };
                return (
                  <TableRow key={d.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link
                        href={`/${type}s/${d.id}`}
                        className="hover:underline"
                      >
                        {d.runningNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{snap?.name ?? "—"}</TableCell>
                    <TableCell>{d.issueDate}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(d.total)} {d.currency}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_CLASSES[d.status] ?? STATUS_CLASSES.draft,
                        )}
                      >
                        {tDoc(`status.${d.status}`)}
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
