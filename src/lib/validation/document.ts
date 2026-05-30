import { z } from "zod";

// ISO date `YYYY-MM-DD`. The HTML5 date input always produces this format.
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const docTypeSchema = z.enum(["quotation", "invoice", "receipt"]);

// VAT rates we support today: exempt or 7%.
const vatRateSchema = z
  .number()
  .refine((v) => v === 0 || v === 7, "invalidVatRate");

const lineSchema = z.object({
  sortOrder: z.number().int().nonnegative(),
  itemId: z
    .string()
    .uuid()
    .nullable()
    .transform((v) => (v ? v : null)),
  description: z.string().trim().min(1, "required").max(1000),
  quantity: z.number().positive("invalidQuantity"),
  unitPrice: z.number().nonnegative("invalidUnitPrice"),
  discountPercent: z
    .number()
    .min(0, "invalidDiscount")
    .max(100, "invalidDiscount"),
  vatRate: vatRateSchema,
});

// WHT rate at the document level: 0/1/3/5 percent. null means "no WHT".
const whtRateSchema = z
  .number()
  .refine((v) => v === 0 || v === 1 || v === 3 || v === 5, "invalidWhtRate")
  .nullable();

export const documentInputSchema = z.object({
  type: docTypeSchema,
  customerId: z.string().uuid("invalidCustomerId"),
  issueDate: z.string().regex(isoDateRegex, "invalidDate"),
  dueDate: z
    .string()
    .regex(isoDateRegex, "invalidDate")
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  notes: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  lines: z.array(lineSchema).min(1, "noLines"),
  whtRate: whtRateSchema
    .optional()
    .transform((v) => (v === undefined ? null : v)),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;
export type DocumentLineInputRaw = z.infer<typeof lineSchema>;
