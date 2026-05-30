/**
 * Thai Personal Income Tax (PIT) progressive bracket table.
 *
 * Effective from tax year 2017 onwards (verified for 2024 filing season).
 * Brackets have been stable through the present — but the Revenue Department
 * occasionally publishes annual tweaks via Royal Decree. TODO: verify
 * against ภ.ง.ด. 90 latest annual update before each filing season.
 *
 * Each bracket entry covers `(from, to]`. The final bracket has `to = null`
 * meaning "no upper bound" (35% applies to everything above 5,000,000).
 */
export type PitBracket = {
  from: number;
  // `null` denotes "no upper bound" — clearer than Infinity for JSON-able
  // downstream consumers (e.g. if we ever ship the table to the client).
  to: number | null;
  rate: number;
};

export const PIT_BRACKETS: readonly PitBracket[] = [
  { from: 0, to: 150_000, rate: 0 },
  { from: 150_000, to: 300_000, rate: 5 },
  { from: 300_000, to: 500_000, rate: 10 },
  { from: 500_000, to: 750_000, rate: 15 },
  { from: 750_000, to: 1_000_000, rate: 20 },
  { from: 1_000_000, to: 2_000_000, rate: 25 },
  { from: 2_000_000, to: 5_000_000, rate: 30 },
  { from: 5_000_000, to: null, rate: 35 },
] as const;

export type BracketResult = {
  from: number;
  to: number | null;
  rate: number;
  // Income that falls into this bracket — useful when explaining the
  // breakdown in the UI.
  taxableInBracket: number;
  taxInBracket: number;
};

export type PitCalculationResult = {
  bracketResults: BracketResult[];
  totalTax: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate PIT against the progressive table.
 *
 * `netIncome` here is "income remaining after every deduction and allowance".
 * Negative values clamp to zero — sometimes deductions exceed gross income
 * and we don't want negative tax leaking into the UI.
 */
export function calculatePIT(netIncome: number): PitCalculationResult {
  const income = Math.max(0, netIncome);
  const bracketResults: BracketResult[] = [];
  let totalTax = 0;

  for (const b of PIT_BRACKETS) {
    if (income <= b.from) break;
    const ceiling = b.to ?? Number.POSITIVE_INFINITY;
    const taxableInBracket = Math.min(income, ceiling) - b.from;
    const taxInBracket = (taxableInBracket * b.rate) / 100;
    bracketResults.push({
      from: b.from,
      to: b.to,
      rate: b.rate,
      taxableInBracket: round2(taxableInBracket),
      taxInBracket: round2(taxInBracket),
    });
    totalTax += taxInBracket;
    if (income <= ceiling) break;
  }

  return { bracketResults, totalTax: round2(totalTax) };
}
