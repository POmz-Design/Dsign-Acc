"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Ban, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useRouter } from "@/i18n/routing";
import { voidDocument } from "@/app/actions/documents";
import { sendDocumentEmail } from "@/app/actions/email";
import { SendEmailDialog } from "@/components/app/send-email-dialog";
import { cn } from "@/lib/utils";
import type { DocumentRow, DocumentLineRow } from "@/lib/db/schema";

type Props = {
  document: DocumentRow;
  lines: DocumentLineRow[];
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

export function DocumentDetailClient({ document: doc, lines }: Props) {
  const t = useTranslations("Documents");
  const tCommon = useTranslations("Common");
  const tWht = useTranslations("Wht");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmVoid, setConfirmVoid] = useState(false);

  const customer = doc.customerSnapshot as {
    name: string;
    tin: string | null;
    email: string | null;
  };
  const isVoid = doc.status === "void";
  const isQuotation = doc.type === "quotation";
  const isInvoice = doc.type === "invoice";

  const onVoidConfirmed = () => {
    startTransition(async () => {
      await voidDocument(doc.id);
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
              {doc.runningNumber}
            </h1>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_CLASSES[doc.status] ?? STATUS_CLASSES.draft,
              )}
            >
              {t(`status.${doc.status}`)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {customer.name} • {doc.issueDate}
            {doc.dueDate ? ` • ${t("table.dueDate")}: ${doc.dueDate}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={`/api/pdf/${doc.id}`} target="_blank" rel="noopener">
              <Download className="h-4 w-4" />
              <span className="ml-2">{t("actions.downloadPdf")}</span>
            </a>
          </Button>
          {!isVoid ? (
            <SendEmailDialog
              initialEmail={customer.email ?? null}
              sentAt={doc.sentAt ? doc.sentAt.toISOString() : null}
              lastSentTo={doc.lastSentTo ?? null}
              action={(toEmail) =>
                sendDocumentEmail({ documentId: doc.id, toEmail })
              }
            />
          ) : null}
          {!isVoid ? (
            <Button
              variant="outline"
              onClick={() => setConfirmVoid(true)}
              disabled={pending}
            >
              <Ban className="h-4 w-4" />
              <span className="ml-2">{t("actions.void")}</span>
            </Button>
          ) : null}
          {isQuotation ? (
            <Button variant="outline" disabled title={t("actions.phase3")}>
              {t("actions.convertToInvoice")}
            </Button>
          ) : null}
          {isInvoice ? (
            <Button variant="outline" disabled title={t("actions.phase3")}>
              {t("actions.generateReceipt")}
            </Button>
          ) : null}
          {isInvoice && !isVoid ? (
            <Button asChild variant="outline">
              <Link href={`/wht/new?fromInvoice=${doc.id}`}>
                <FileText className="h-4 w-4" />
                <span className="ml-2">{tWht("issueFromInvoice")}</span>
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border bg-background">
        <div className="grid grid-cols-[40px_1fr_70px_90px_70px_90px] gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>#</span>
          <span>{t("table.description")}</span>
          <span className="text-right">{t("table.qty")}</span>
          <span className="text-right">{t("table.unitPrice")}</span>
          <span className="text-right">{t("table.discount")}</span>
          <span className="text-right">{t("table.amount")}</span>
        </div>
        {lines.map((l, i) => (
          <div
            key={l.id}
            className="grid grid-cols-[40px_1fr_70px_90px_70px_90px] gap-2 border-b px-3 py-2 last:border-b-0"
          >
            <span>{i + 1}</span>
            <span>{l.description}</span>
            <span className="text-right tabular-nums">{l.quantity}</span>
            <span className="text-right tabular-nums">{fmt(l.unitPrice)}</span>
            <span className="text-right tabular-nums">
              {Number(l.discountPercent) > 0
                ? `${Number(l.discountPercent)}%`
                : "—"}
            </span>
            <span className="text-right tabular-nums">{fmt(l.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="ml-auto max-w-xs rounded-md border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="tabular-nums">{fmt(doc.subtotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">{t("vat")}</span>
          <span className="tabular-nums">{fmt(doc.vatAmount)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">{t("total")}</span>
          <span className="tabular-nums">{fmt(doc.total)}</span>
        </div>
        {Number(doc.whtAmount) > 0 ? (
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">{t("wht")}</span>
            <span className="tabular-nums">−{fmt(doc.whtAmount)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
          <span>{t("netPayable")}</span>
          <span className="tabular-nums">
            {fmt(doc.netPayable)} {doc.currency}
          </span>
        </div>
      </div>

      {doc.notes ? (
        <div className="rounded-md border bg-background p-4 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {t("notes")}
          </p>
          <p className="whitespace-pre-wrap">{doc.notes}</p>
        </div>
      ) : null}

      <Dialog
        open={confirmVoid}
        onOpenChange={(open) => !open && setConfirmVoid(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("voidTitle")}</DialogTitle>
            <DialogDescription>{t("voidConfirm")}</DialogDescription>
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
              {pending ? tCommon("saving") : t("actions.void")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
