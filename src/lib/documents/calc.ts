import type {
  DocumentLineInput,
  DocumentLinePayload,
  DocumentTotals,
} from "./types";

// THB rounds to 2 decimals (satang). Standard half-up rounding is what the
// Thai Revenue Department applies — no banker's rounding required.
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type LineComputed = {
  lineTotal: number;
  vatAmount: number;
};

/**
 * Compute one line: `qty * unitPrice * (1 - discount/100)`, then VAT on
 * the discounted subtotal. Returns the discounted subtotal as `lineTotal`
 * (VAT excluded) and the line's VAT as `vatAmount`.
 */
export function calculateLineTotal(
  qty: number,
  unitPrice: number,
  discountPercent: number,
  vatRate: number,
): LineComputed {
  const gross = qty * unitPrice;
  const discounted = gross * (1 - discountPercent / 100);
  const lineTotal = round2(discounted);
  const vatAmount = round2(lineTotal * (vatRate / 100));
  return { lineTotal, vatAmount };
}

/**
 * Aggregate totals across all lines. Optional doc-level WHT is computed
 * against the pre-VAT subtotal (Thai convention).
 *
 * netPayable = total − wht  (what the customer actually transfers)
 * total      = subtotal + vat
 */
export function calculateDocument(
  lines: DocumentLineInput[],
  whtRate: number | null = null,
): {
  computedLines: DocumentLinePayload[];
  totals: DocumentTotals;
} {
  const computedLines: DocumentLinePayload[] = lines.map((l) => {
    const { lineTotal, vatAmount } = calculateLineTotal(
      l.quantity,
      l.unitPrice,
      l.discountPercent,
      l.vatRate,
    );
    return { ...l, lineTotal, vatAmount };
  });

  const subtotal = round2(
    computedLines.reduce((sum, l) => sum + l.lineTotal, 0),
  );
  const vatAmount = round2(
    computedLines.reduce((sum, l) => sum + l.vatAmount, 0),
  );
  const total = round2(subtotal + vatAmount);
  const whtAmount =
    whtRate && whtRate > 0 ? round2(subtotal * (whtRate / 100)) : 0;
  const netPayable = round2(total - whtAmount);

  return {
    computedLines,
    totals: { subtotal, vatAmount, whtAmount, total, netPayable },
  };
}
