"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Download, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/routing";
import { voidWhtCertificate } from "@/app/actions/wht";
import { cn } from "@/lib/utils";
import {
  WHT_INCOME_TYPES,
  toBuddhistEra,
  type WhtIncomeLine,
} from "@/lib/documents/wht-types";
import type { WhtCertificateRow } from "@/lib/db/schema";

type Props = {
  certificate: WhtCertificateRow;
  // Locale for picking Thai vs English income-type labels.
  locale: string;
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

export function WhtDetailClient({ certificate: cert, locale }: Props) {
  const t = useTranslations("Wht");
  const tDoc = useTranslations("Documents");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmVoid, setConfirmVoid] = useState(false);

  const customer = cert.customerSnapshot as {
    name: string;
    tin: string | null;
  };
  const lines = cert.incomeTypes as WhtIncomeLine[];
  const isVoid = cert.status === "void";
  const useEn = locale === "en";

  const onVoidConfirmed = () => {
    startTransition(async () => {
      await voidWhtCertificate(cert.id);
      setConfirmVoid(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">
              {cert.runningNumber}
            </h1>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_CLASSES[cert.status] ?? STATUS_CLASSES.issued,
              )}
            >
              {t(`status.${cert.status}`)}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {cert.formType === "pnd3" ? t("formPnd3Short") : t("formPnd53Short")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {customer.name} • {t("table.paymentDate")}: {cert.paymentDate} •{" "}
            {t("taxYear")}: {toBuddhistEra(cert.year)} ({cert.year})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={`/api/wht-pdf/${cert.id}`} target="_blank" rel="noopener">
              <Download className="h-4 w-4" />
              <span className="ml-2">{tDoc("actions.downloadPdf")}</span>
            </a>
          </Button>
          {!isVoid ? (
            <Button
              variant="outline"
              onClick={() => setConfirmVoid(true)}
              disabled={pending}
            >
              <Ban className="h-4 w-4" />
              <span className="ml-2">{tDoc("actions.void")}</span>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <div className="grid grid-cols-[2fr_1.5fr_110px_100px_80px_110px] gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>{t("table.incomeType")}</span>
          <span>{t("table.description")}</span>
          <span>{t("table.paymentDate")}</span>
          <span className="text-right">{t("table.gross")}</span>
          <span className="text-right">{t("table.rate")}</span>
          <span className="text-right">{t("table.withheld")}</span>
        </div>
        {lines.map((l, i) => {
          const meta = WHT_INCOME_TYPES[l.code];
          return (
            <div
              key={i}
              className="grid grid-cols-[2fr_1.5fr_110px_100px_80px_110px] gap-2 border-b px-3 py-2 last:border-b-0"
            >
              <span>{useEn ? meta.enLabel : meta.thLabel}</span>
              <span className="text-muted-foreground">{l.description}</span>
              <span>{l.paymentDate}</span>
              <span className="text-right tabular-nums">
                {fmt(l.grossAmount)}
              </span>
              <span className="text-right tabular-nums">{l.rate}%</span>
              <span className="text-right tabular-nums">
                {fmt(l.withheldAmount)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="ml-auto max-w-xs rounded-md border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">{t("table.gross")}</span>
          <span className="tabular-nums">{fmt(cert.totalGross)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>{t("table.withheld")}</span>
          <span className="tabular-nums">{fmt(cert.totalWithheld)}</span>
        </div>
      </div>

      <div className="rounded-md border bg-background p-4 text-sm">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t("paymentMethod")}
        </p>
        <p>{t(`paymentMethodOptions.${cert.paymentMethod}`)}</p>
      </div>

      {cert.notes ? (
        <div className="rounded-md border bg-background p-4 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {tDoc("notes")}
          </p>
          <p className="whitespace-pre-wrap">{cert.notes}</p>
        </div>
      ) : null}

      <Dialog
        open={confirmVoid}
        onOpenChange={(open) => !open && setConfirmVoid(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tDoc("voidTitle")}</DialogTitle>
            <DialogDescription>{tDoc("voidConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmVoid(false)}
              disabled={pending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onVoidConfirmed}
              disabled={pending}
            >
              {pending ? tCommon("saving") : tDoc("actions.void")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
