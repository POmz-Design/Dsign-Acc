import { z } from "zod";

const decimalStringRegex = /^\d+(\.\d{1,2})?$/;

const emptyToNull = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

// WHT rates we support today: none, 1%, 3%, 5%.
const whtRateValues = ["1.00", "3.00", "5.00"] as const;

export const itemSchema = z.object({
  name: z.string().trim().min(1, "required").max(255),
  description: emptyToNull.pipe(z.string().max(2000).nullable()),
  unit: z.string().trim().min(1, "required").max(50).default("ชิ้น"),
  unitPrice: z
    .string()
    .trim()
    .regex(decimalStringRegex, "invalidNumber"),
  vatApplicable: z.boolean().default(true),
  whtRate: emptyToNull.pipe(
    z.enum(whtRateValues).nullable(),
  ),
  isActive: z.boolean().default(true),
});

export type ItemInput = z.infer<typeof itemSchema>;
