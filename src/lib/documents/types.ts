// Frozen payload types stored in `documents.jsonPayload`. The PDF route
// consumes this shape directly so changes here must be backwards-compatible.

export type DocType = "quotation" | "invoice" | "receipt";

// Union used by the running-number counter machinery. Phase 3 added "wht"
// so WHT certificates can share the `document_counters` table. Kept
// separate from `DocType` because `DocumentPayload.type` and the PDF
// `DOC_TITLES` map only handle real documents — WHT certs live in their
// own table with their own PDF.
export type CounterDocType = DocType | "wht";

export type CustomerSnapshot = {
  name: string;
  tin: string | null;
  branchCode: string | null;
  isJuristic: boolean;
  address: string | null;
  email: string | null;
  phone: string | null;
};

export type CompanySnapshot = {
  nameTh: string;
  nameEn: string | null;
  tin: string;
  branchCode: string;
  addressTh: string;
  addressEn: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
};

export type DocumentLineInput = {
  sortOrder: number;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
};

export type DocumentLinePayload = DocumentLineInput & {
  lineTotal: number;
  // Line-level VAT exposed for transparency on the PDF. Sums to
  // totals.vatAmount.
  vatAmount: number;
};

export type DocumentTotals = {
  subtotal: number;
  vatAmount: number;
  whtAmount: number;
  total: number;       // subtotal + vat
  netPayable: number;  // total - wht
};

export type DocumentPayload = {
  type: DocType;
  runningNumber: string;
  issueDate: string;   // ISO date
  dueDate: string | null;
  currency: string;
  notes: string | null;
  company: CompanySnapshot;
  customer: CustomerSnapshot;
  lines: DocumentLinePayload[];
  totals: DocumentTotals;
  whtRate: number | null; // applied at doc level; Phase 3 will refine
};

export const DOC_TYPE_PREFIX: Record<CounterDocType, string> = {
  quotation: "Q",
  invoice: "INV",
  receipt: "RCP",
  wht: "WHT",
};
