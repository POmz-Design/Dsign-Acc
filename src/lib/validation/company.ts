import { z } from "zod";

const tinRegex = /^\d{13}$/;
// Branch codes are 5 digits ("00000" for head office).
const branchCodeRegex = /^\d{5}$/;

// Stored as numeric strings to match Drizzle's numeric() column type.
const decimalStringRegex = /^\d+(\.\d{1,2})?$/;

// Block javascript:/data:/file: schemes — z.string().url() accepts them.
// These fields get rendered as <img src=...> on PDFs in Phase 2.
const httpUrl = z
  .string()
  .url("invalidUrl")
  .refine((v) => /^https?:\/\//i.test(v), "invalidUrl");

const emptyToNull = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

export const companySchema = z.object({
  nameTh: z.string().trim().min(1, "required").max(255),
  nameEn: emptyToNull.pipe(z.string().max(255).nullable()),
  tin: z
    .string()
    .trim()
    .regex(tinRegex, "invalidTin"),
  branchCode: z
    .string()
    .trim()
    .regex(branchCodeRegex, "invalidBranchCode")
    .default("00000"),
  addressTh: z.string().trim().min(1, "required").max(1000),
  addressEn: emptyToNull.pipe(z.string().max(1000).nullable()),
  phone: emptyToNull.pipe(z.string().max(50).nullable()),
  email: emptyToNull.pipe(z.string().email("invalidEmail").nullable()),
  logoUrl: emptyToNull.pipe(httpUrl.nullable()),
  signatureUrl: emptyToNull.pipe(httpUrl.nullable()),
  defaultVatRate: z
    .string()
    .trim()
    .regex(decimalStringRegex, "invalidNumber")
    .default("7.00"),
  defaultCurrency: z.string().trim().min(1).max(8).default("THB"),
});

export type CompanyInput = z.infer<typeof companySchema>;
