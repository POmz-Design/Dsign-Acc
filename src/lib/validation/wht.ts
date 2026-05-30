import { z } from "zod";

import { WHT_INCOME_TYPE_CODES } from "@/lib/documents/wht-types";

// `YYYY-MM-DD` — HTML5 date input format.
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const formTypeSchema = z.enum(["pnd3", "pnd53"]);
const paymentMethodSchema = z.enum(["withheld", "paid_for_payee", "other"]);

// z.enum requires a non-empty tuple literal. Cast through unknown is fine
// because WHT_INCOME_TYPE_CODES is `readonly WhtIncomeTypeCode[]`.
const incomeCodeSchema = z.enum(
  WHT_INCOME_TYPE_CODES as unknown as [string, ...string[]],
);

const whtLineSchema = z.object({
  code: incomeCodeSchema,
  description: z.string().trim().min(1, "required").max(500),
  paymentDate: z.string().regex(isoDateRegex, "invalidDate"),
  grossAmount: z.number().positive("invalidGross"),
  rate: z.number().min(0, "invalidRate").max(100, "invalidRate"),
  // Client may send a stale value — actions recompute server-side. We still
  // require a number here so the row shape stays uniform.
  withheldAmount: z.number().nonnegative("invalidWithheld"),
});

export const whtCertificateInputSchema = z.object({
  customerId: z.string().uuid("invalidCustomerId"),
  invoiceId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  formType: formTypeSchema,
  paymentDate: z.string().regex(isoDateRegex, "invalidDate"),
  paymentMethod: paymentMethodSchema,
  notes: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  // ภ.ง.ด. 3/53 max 8 income-type rows per form.
  lines: z.array(whtLineSchema).min(1, "noLines").max(8, "tooManyLines"),
});

export type WhtCertificateInput = z.infer<typeof whtCertificateInputSchema>;
export type WhtLineInputRaw = z.infer<typeof whtLineSchema>;
