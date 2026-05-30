"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/routing";

type SendResult =
  | { success: true; data?: { sentTo: string; sentAt: string } }
  | { success: false; error: string };

type Props = {
  // Initial email pre-filled into the dialog. May be empty when the
  // customer record has no email — the user can still type one in.
  initialEmail: string | null;
  // Existing send timestamp (ISO string) — drives "Sent on …" caption.
  sentAt: string | null;
  lastSentTo: string | null;
  // Server action wrapped by the caller — the dialog stays generic so it
  // can serve both documents and WHT certs.
  action: (toEmail: string) => Promise<SendResult>;
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function SendEmailDialog({
  initialEmail,
  sentAt,
  lastSentTo,
  action,
}: Props) {
  const t = useTranslations("EmailSend");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    if (!pending) {
      setOpen(next);
      if (next) {
        setError(null);
        setOkMessage(null);
        setEmail(initialEmail ?? "");
      }
    }
  }

  function onSubmit() {
    setError(null);
    setOkMessage(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("errors.required"));
      return;
    }
    startTransition(async () => {
      const res = await action(trimmed);
      if (res.success) {
        setOkMessage(t("success", { email: res.data?.sentTo ?? trimmed }));
        // Refresh so server props (sentAt/lastSentTo) update behind the dialog.
        router.refresh();
        // Close after a beat so the user sees the success state.
        setTimeout(() => setOpen(false), 1200);
      } else {
        const knownErrors = new Set([
          "noEmail",
          "invalidEmail",
          "noCompany",
          "notFound",
          "voided",
          "pdfFailed",
          "sendFailed",
        ]);
        setError(
          knownErrors.has(res.error)
            ? t(`errors.${res.error}`)
            : t("errors.generic"),
        );
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4" />
        <span className="ml-2">{t("button")}</span>
      </Button>
      {sentAt ? (
        <p className="text-xs text-muted-foreground">
          {t("lastSent", {
            email: lastSentTo ?? "—",
            when: fmtDate(sentAt),
          })}
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {okMessage ? (
            <Alert>
              <AlertDescription>{okMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="send-email">{t("toLabel")}</Label>
            <Input
              id="send-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              disabled={pending}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={onSubmit} disabled={pending}>
              {pending ? t("sending") : t("send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
