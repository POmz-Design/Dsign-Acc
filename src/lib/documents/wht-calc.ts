import { round2 } from "./calc";
import type { WhtIncomeLine } from "./wht-types";

export type WhtLineComputed = {
  withheldAmount: number;
};

export type WhtTotals = {
  totalGross: number;
  totalWithheld: number;
};

/**
 * Compute one income-type line's withheld amount: `gross * rate / 100`,
 * rounded to 2dp (Thai Revenue uses half-up to satang).
 */
export function calculateWhtLine(
  gross: number,
  rate: number,
): WhtLineComputed {
  if (!Number.isFinite(gross) || !Number.isFinite(rate)) {
    return { withheldAmount: 0 };
  }
  return { withheldAmount: round2((gross * rate) / 100) };
}

/**
 * Sum totals across all income-type lines. Each `withheldAmount` is taken
 * as-stored (server actions recompute it before persisting, so the input
 * here is already canonical).
 */
export function calculateWhtTotals(lines: WhtIncomeLine[]): WhtTotals {
  const totalGross = round2(
    lines.reduce((sum, l) => sum + (Number.isFinite(l.grossAmount) ? l.grossAmount : 0), 0),
  );
  const totalWithheld = round2(
    lines.reduce((sum, l) => sum + (Number.isFinite(l.withheldAmount) ? l.withheldAmount : 0), 0),
  );
  return { totalGross, totalWithheld };
}
