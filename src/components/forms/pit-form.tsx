"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { calculatePit, PIT_CAPS, type PitFormType } from "@/lib/tax/pit-calc";

type FormShape = {
  formType: PitFormType;
  grossIncome: string;
  withholdingPaid: string;
  spouse: boolean;
  children: string;
  parents: string;
  disabled: string;
  socialSecurity: string;
  providentFund: string;
  mortgageInterest: string;
  lifeInsurance: string;
  healthInsurance: string;
  parentHealthInsurance: string;
  charityDonations: string;
  educationDonations: string;
};

function n(s: string): number {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
}

function fmt(v: number): string {
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtInt(v: number): string {
  return v.toLocaleString("en-US");
}

function defaultValues(): FormShape {
  return {
    formType: "pnd90",
    grossIncome: "0",
    withholdingPaid: "0",
    spouse: false,
    children: "0",
    parents: "0",
    disabled: "0",
    socialSecurity: "0",
    providentFund: "0",
    mortgageInterest: "0",
    lifeInsurance: "0",
    healthInsurance: "0",
    parentHealthInsurance: "0",
    charityDonations: "0",
    educationDonations: "0",
  };
}

export function PitForm() {
  const t = useTranslations("PitForm");
  const [submitted, setSubmitted] = useState<ReturnType<
    typeof calculatePit
  > | null>(null);

  const { register, handleSubmit, watch, setValue, getValues } =
    useForm<FormShape>({ defaultValues: defaultValues() });
  const formType = watch("formType");

  const allowanceFields = useMemo(
    () =>
      [
        {
          key: "socialSecurity",
          cap: PIT_CAPS.socialSecurity,
        },
        {
          key: "providentFund",
          cap: PIT_CAPS.providentFund,
        },
        {
          key: "mortgageInterest",
          cap: PIT_CAPS.mortgageInterest,
        },
        {
          key: "lifeInsurance",
          cap: PIT_CAPS.lifeInsurance,
        },
        {
          key: "healthInsurance",
          cap: PIT_CAPS.healthInsurance,
        },
        {
          key: "parentHealthInsurance",
          cap: PIT_CAPS.parentHealthInsurance,
        },
        {
          key: "charityDonations",
          // 10% cap is computed dynamically — show "10%" hint instead.
          cap: null,
        },
        {
          key: "educationDonations",
          cap: null,
        },
      ] as const,
    [],
  );

  const onSubmit = handleSubmit(() => {
    const v = getValues();
    const r = calculatePit({
      formType: v.formType,
      grossIncome: n(v.grossIncome),
      withholdingPaid: n(v.withholdingPaid),
      deductions: {
        spouse: v.spouse,
        children: Math.floor(n(v.children)),
        parents: Math.floor(n(v.parents)),
        disabled: Math.floor(n(v.disabled)),
        socialSecurity: n(v.socialSecurity),
        providentFund: n(v.providentFund),
        mortgageInterest: n(v.mortgageInterest),
        lifeInsurance: n(v.lifeInsurance),
        healthInsurance: n(v.healthInsurance),
        parentHealthInsurance: n(v.parentHealthInsurance),
        charityDonations: n(v.charityDonations),
        educationDonations: n(v.educationDonations),
      },
    });
    setSubmitted(r);
    // Scroll the results panel into view on small screens.
    if (typeof window !== "undefined") {
      // Defer until after React commit.
      setTimeout(() => {
        document
          .getElementById("pit-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  });

  const isRefund = (submitted?.taxRefundOrDue ?? 0) >= 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("section.basics")}</CardTitle>
          <CardDescription>{t("section.basicsHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("formTypeLabel")}</Label>
            <div className="flex gap-4 pt-1 text-sm">
              {(["pnd90", "pnd91"] as const).map((ft) => (
                <label key={ft} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={ft}
                    checked={formType === ft}
                    onChange={() => setValue("formType", ft)}
                  />
                  {t(`formType.${ft}`)}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="grossIncome">{t("grossIncome")}</Label>
              <Input
                id="grossIncome"
                inputMode="decimal"
                className="text-right"
                {...register("grossIncome")}
              />
              <p className="text-xs text-muted-foreground">
                {t("grossIncomeHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="withholdingPaid">{t("withholdingPaid")}</Label>
              <Input
                id="withholdingPaid"
                inputMode="decimal"
                className="text-right"
                {...register("withholdingPaid")}
              />
              <p className="text-xs text-muted-foreground">
                {t("withholdingPaidHint")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("section.familyAllowances")}
          </CardTitle>
          <CardDescription>
            {t("section.familyAllowancesHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("spouse")}
              onCheckedChange={(v) => setValue("spouse", v === true)}
            />
            <span>
              {t("spouse")}{" "}
              <span className="text-muted-foreground">
                ({fmtInt(PIT_CAPS.spouseAllowance)} THB)
              </span>
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["children", "parents", "disabled"] as const).map((k) => (
              <div className="space-y-1.5" key={k}>
                <Label htmlFor={k}>{t(k)}</Label>
                <Input
                  id={k}
                  type="number"
                  min="0"
                  step="1"
                  className="text-right"
                  {...register(k)}
                />
                <p className="text-xs text-muted-foreground">
                  {t(`${k}Hint`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("section.financialAllowances")}
          </CardTitle>
          <CardDescription>
            {t("section.financialAllowancesHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {allowanceFields.map((f) => (
            <div className="space-y-1.5" key={f.key}>
              <Label htmlFor={f.key}>{t(f.key)}</Label>
              <Input
                id={f.key}
                inputMode="decimal"
                className="text-right"
                {...register(f.key)}
              />
              <p className="text-xs text-muted-foreground">
                {f.cap === null
                  ? t("donationCapHint")
                  : t("capHint", { amount: fmtInt(f.cap) })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled
            title={t("saveComingSoon")}
          >
            {t("save")}
          </Button>
          <Button type="submit">{t("calculate")}</Button>
        </div>
      </div>

      {submitted ? (
        <Card id="pit-results">
          <CardHeader>
            <CardTitle className="text-lg">{t("results.title")}</CardTitle>
            <CardDescription>{t("results.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">
                  {t("results.grossIncome")}
                </span>
                <span className="tabular-nums">
                  {fmt(submitted.grossIncome)}
                </span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">
                  {t("results.expenseDeduction")}
                </span>
                <span className="tabular-nums">
                  −{fmt(submitted.expenseDeduction)}
                </span>
              </div>
              <div className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">
                  {t("results.totalAllowances")}
                </span>
                <span className="tabular-nums">
                  −{fmt(submitted.totalAllowances)}
                </span>
              </div>
              <div className="flex justify-between border-b py-1 font-medium">
                <span>{t("results.netIncome")}</span>
                <span className="tabular-nums">
                  {fmt(submitted.netIncome)}
                </span>
              </div>
            </div>

            <div className="rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("results.bracket")}</TableHead>
                    <TableHead className="text-right">
                      {t("results.taxable")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("results.rate")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("results.taxInBracket")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submitted.bracketBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        {t("results.noTax")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    submitted.bracketBreakdown.map((b) => (
                      <TableRow key={`${b.from}-${b.to ?? "inf"}`}>
                        <TableCell>
                          {fmtInt(b.from)} –{" "}
                          {b.to === null ? "∞" : fmtInt(b.to)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmt(b.taxableInBracket)}
                        </TableCell>
                        <TableCell className="text-right">
                          {b.rate}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmt(b.taxInBracket)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="ml-auto max-w-sm space-y-1 rounded-md border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">
                  {t("results.taxBefore")}
                </span>
                <span className="tabular-nums">{fmt(submitted.taxBefore)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">
                  {t("results.withholdingPaid")}
                </span>
                <span className="tabular-nums">
                  −{fmt(submitted.withholdingPaid)}
                </span>
              </div>
              <div
                className={cn(
                  "mt-2 flex justify-between border-t pt-2 font-semibold",
                  isRefund ? "text-emerald-700" : "text-rose-700",
                )}
              >
                <span>
                  {isRefund
                    ? t("results.refund")
                    : t("results.additionalDue")}
                </span>
                <span className="tabular-nums">
                  {fmt(Math.abs(submitted.taxRefundOrDue))} THB
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t("results.disclaimer")}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
}
