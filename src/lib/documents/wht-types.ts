// Frozen domain types for Thai Withholding Tax (WHT) certificates.
// `WhtCertificateRow.incomeTypes` is `WhtIncomeLine[]` at runtime — keep
// these shapes stable so old certs stay readable after future migrations.

import type {
  WhtFormType,
  WhtIncomeTypeCode,
  WhtIncomeLine,
} from "@/lib/db/schema";

export type { WhtFormType, WhtIncomeTypeCode, WhtIncomeLine };

// Three checkboxes on the actual ภ.ง.ด. form:
//   "withheld"       — หัก ณ ที่จ่าย (default — payer kept the tax back)
//   "paid_for_payee" — ออกให้ผู้ถูกหักตลอดไป (payer absorbed the tax)
//   "other"          — อื่นๆ (free-text notes describe the variant)
export type WhtPaymentMethod = "withheld" | "paid_for_payee" | "other";

export type WhtIncomeTypeMeta = {
  thLabel: string;
  enLabel: string;
  // Statutory default rate. 40(1) salary uses the progressive table so we
  // leave it at 0 — operators must enter the actual rate manually.
  defaultRate: number;
};

export const WHT_INCOME_TYPES: Record<WhtIncomeTypeCode, WhtIncomeTypeMeta> = {
  "40_1": {
    thLabel: "40(1) เงินเดือน ค่าจ้าง",
    enLabel: "40(1) Salary / Wages",
    defaultRate: 0,
  },
  "40_2": {
    thLabel: "40(2) ค่านายหน้า ค่าธรรมเนียม",
    enLabel: "40(2) Commissions / Fees",
    defaultRate: 3,
  },
  "40_3": {
    thLabel: "40(3) ค่าแห่งกู๊ดวิลล์ ค่าลิขสิทธิ์",
    enLabel: "40(3) Goodwill / Royalties",
    defaultRate: 3,
  },
  "40_4_a": {
    thLabel: "40(4)ก ดอกเบี้ย",
    enLabel: "40(4)(a) Interest",
    defaultRate: 1,
  },
  "40_4_b": {
    thLabel: "40(4)ข เงินปันผล",
    enLabel: "40(4)(b) Dividends",
    defaultRate: 10,
  },
  "40_5": {
    thLabel: "40(5) ค่าเช่า",
    enLabel: "40(5) Rent",
    defaultRate: 5,
  },
  "40_6": {
    thLabel: "40(6) ค่าวิชาชีพอิสระ",
    enLabel: "40(6) Professional fees",
    defaultRate: 3,
  },
  "40_7": {
    thLabel: "40(7) ค่าจ้างทำของ",
    enLabel: "40(7) Contractor fees",
    defaultRate: 3,
  },
  "40_8": {
    thLabel: "40(8) ค่าบริการ/อื่นๆ",
    enLabel: "40(8) Services / Other",
    defaultRate: 3,
  },
};

export const WHT_INCOME_TYPE_CODES: readonly WhtIncomeTypeCode[] = [
  "40_1",
  "40_2",
  "40_3",
  "40_4_a",
  "40_4_b",
  "40_5",
  "40_6",
  "40_7",
  "40_8",
] as const;

/**
 * Convert a CE (Gregorian) year to Buddhist Era — Thai Revenue Department
 * forms use พ.ศ. throughout.
 *   BE = CE + 543
 */
export function toBuddhistEra(year: number): number {
  return year + 543;
}
