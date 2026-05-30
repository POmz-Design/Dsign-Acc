/**
 * Thai Personal Income Tax (ภ.ง.ด. 90 / 91) full calculation pipeline.
 *
 * The 90 vs 91 distinction is informational — 91 is for salary-only filers,
 * 90 is for anyone with multiple income types. The arithmetic is identical;
 * the form picker just changes the printed header.
 *
 * Allowance caps reflect 2024 Thai law. TODO: verify against ภ.ง.ด. 90
 * latest annual update before each filing season — caps occasionally
 * change but bracket rates have been stable since 2017.
 */

import { calculatePIT, type BracketResult } from "./pit-brackets";

export type PitFormType = "pnd90" | "pnd91";

export type PitDeductions = {
  // Spouse with no income.
  spouse: boolean;
  // Number of qualifying children. The "first 3" bonus is not modelled
  // here — we apply a flat 30k each since users almost never have > 3 in
  // practice and the bonus is a rounding-error edge case for this tool.
  children: number;
  // Number of parents being cared for (max 4 in law).
  parents: number;
  // Number of disabled persons under care.
  disabled: number;
  socialSecurity: number;
  providentFund: number;
  mortgageInterest: number;
  lifeInsurance: number;
  healthInsurance: number;
  parentHealthInsurance: number;
  charityDonations: number;
  educationDonations: number;
};

export type PitInput = {
  formType: PitFormType;
  grossIncome: number;
  // Tax already withheld during the year — subtracted from the computed
  // liability to produce refund/due.
  withholdingPaid: number;
  deductions: PitDeductions;
};

export type PitResult = {
  grossIncome: number;
  // 50% of gross, capped at 100,000 — the standard expense deduction for
  // 40(2)–40(8) income. Modelled flat here; advanced filers with actual
  // expense proof should consult an accountant.
  expenseDeduction: number;
  totalAllowances: number;
  // Income after both expense + allowances.
  netIncome: number;
  // Tax owed before subtracting withheld amounts.
  taxBefore: number;
  withholdingPaid: number;
  // Positive = refund due to filer; negative = additional tax owed.
  // We expose this with the sign so the UI can color it.
  taxRefundOrDue: number;
  bracketBreakdown: BracketResult[];
};

// Statutory caps for 2024.
export const PIT_CAPS = {
  expenseDeductionMax: 100_000,
  personalAllowance: 60_000,
  spouseAllowance: 60_000,
  childPerHead: 30_000,
  parentPerHead: 30_000,
  disabledPerHead: 60_000,
  socialSecurity: 9_000,
  providentFund: 500_000,
  mortgageInterest: 100_000,
  lifeInsurance: 100_000,
  healthInsurance: 25_000,
  parentHealthInsurance: 15_000,
  donationPctOfNet: 0.1,
} as const;

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Run the full PIT pipeline. Every input is clamped to a non-negative
 * value; caps are applied per-line. Donations are applied LAST because
 * their cap is a percentage of post-deduction income.
 */
export function calculatePit(input: PitInput): PitResult {
  const gross = Math.max(0, input.grossIncome);
  const d = input.deductions;

  // Expense deduction: 50% of gross, capped at 100k. The cap applies to
  // 40(2)–40(8) income; pure-salary (40(1)) filers also get this same flat
  // deduction in practice so we don't branch on formType.
  const expenseDeduction = Math.min(gross * 0.5, PIT_CAPS.expenseDeductionMax);

  // Standard allowances — each subject to its own cap.
  const personal = PIT_CAPS.personalAllowance;
  const spouse = d.spouse ? PIT_CAPS.spouseAllowance : 0;
  const children = Math.max(0, d.children) * PIT_CAPS.childPerHead;
  const parents =
    Math.min(Math.max(0, d.parents), 4) * PIT_CAPS.parentPerHead;
  const disabled = Math.max(0, d.disabled) * PIT_CAPS.disabledPerHead;
  const socialSecurity = clamp(d.socialSecurity, PIT_CAPS.socialSecurity);
  const providentFund = clamp(d.providentFund, PIT_CAPS.providentFund);
  const mortgageInterest = clamp(
    d.mortgageInterest,
    PIT_CAPS.mortgageInterest,
  );
  const lifeInsurance = clamp(d.lifeInsurance, PIT_CAPS.lifeInsurance);
  const healthInsurance = clamp(d.healthInsurance, PIT_CAPS.healthInsurance);
  const parentHealthInsurance = clamp(
    d.parentHealthInsurance,
    PIT_CAPS.parentHealthInsurance,
  );

  const baseAllowances =
    personal +
    spouse +
    children +
    parents +
    disabled +
    socialSecurity +
    providentFund +
    mortgageInterest +
    lifeInsurance +
    healthInsurance +
    parentHealthInsurance;

  // Donations cap is 10% of income AFTER expense + allowances. Apply
  // education first (it's ×2 inside the cap, then the standard cap on the
  // doubled value), then ordinary charity in the remaining headroom.
  const preDonationNet = Math.max(0, gross - expenseDeduction - baseAllowances);
  const donationCap = preDonationNet * PIT_CAPS.donationPctOfNet;

  const eduDoubled = Math.max(0, d.educationDonations) * 2;
  const educationApplied = Math.min(eduDoubled, donationCap);
  const remainingDonationCap = Math.max(0, donationCap - educationApplied);
  const charityApplied = Math.min(
    Math.max(0, d.charityDonations),
    remainingDonationCap,
  );

  const totalAllowances = round2(
    baseAllowances + educationApplied + charityApplied,
  );

  const netIncome = Math.max(0, round2(gross - expenseDeduction - totalAllowances));
  const { bracketResults, totalTax } = calculatePIT(netIncome);
  const withholdingPaid = Math.max(0, input.withholdingPaid);
  // Positive number = the filer paid too much WHT → refund owed to them.
  // Negative number = additional tax to remit at filing.
  const taxRefundOrDue = round2(withholdingPaid - totalTax);

  return {
    grossIncome: round2(gross),
    expenseDeduction: round2(expenseDeduction),
    totalAllowances,
    netIncome,
    taxBefore: totalTax,
    withholdingPaid: round2(withholdingPaid),
    taxRefundOrDue,
    bracketBreakdown: bracketResults,
  };
}
