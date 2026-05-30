"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type StatusFilter = "all" | "issued" | "void";

export function WhtClient({ certificates }: Props) {
  const t = useTranslations("Wht");
  const tDoc = useTranslations("Documents");
  const tFilters = useTranslations("Documents.filters");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certificates.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (from && c.paymentDate < from) return false;
      if (to && c.paymentDate > to) return false;
      if (q) {
        const snap = c.customerSnapshot as { name?: string };
        const haystack =
          `${c.runningNumber} ${snap?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [certificates, search, status, from, to]);

  const hasFilter =
    search.trim() !== "" || status !== "all" || from !== "" || to !== "";

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
        <>
          <div className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="wht-search" className="text-xs">
                {tFilters("search")}
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="wht-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tFilters("searchPlaceholder")}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wht-status" className="text-xs">
                {tFilters("status")}
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as StatusFilter)}
              >
                <SelectTrigger id="wht-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tFilters("statusAll")}</SelectItem>
                  <SelectItem value="issued">
                    {t("status.issued")}
                  </SelectItem>
                  <SelectItem value="void">{t("status.void")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wht-from" className="text-xs">
                {tFilters("from")}
              </Label>
              <Input
                id="wht-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wht-to" className="text-xs">
                {tFilters("to")}
              </Label>
              <Input
                id="wht-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border bg-background p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {hasFilter ? tFilters("noMatches") : t("empty")}
              </p>
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
                    <TableHead className="text-right">
                      {t("table.gross")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("table.withheld")}
                    </TableHead>
                    <TableHead>{tDoc("table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
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
                          {c.formType === "pnd3"
                            ? t("formPnd3Short")
                            : t("formPnd53Short")}
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
                              STATUS_CLASSES[c.status] ??
                                STATUS_CLASSES.issued,
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
        </>
      )}
    </div>
  );
}
