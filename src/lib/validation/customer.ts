import { z } from "zod";

const tinRegex = /^\d{13}$/;
const branchCodeRegex = /^\d{5}$/;

const emptyToNull = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

export const customerSchema = z.object({
  name: z.string().trim().min(1, "required").max(255),
  tin: emptyToNull.pipe(
    z
      .string()
      .regex(tinRegex, "invalidTin")
      .nullable(),
  ),
  branchCode: emptyToNull.pipe(
    z
      .string()
      .regex(branchCodeRegex, "invalidBranchCode")
      .nullable(),
  ),
  isJuristic: z.boolean().default(false),
  address: emptyToNull.pipe(z.string().max(1000).nullable()),
  email: emptyToNull.pipe(z.string().email("invalidEmail").nullable()),
  phone: emptyToNull.pipe(z.string().max(50).nullable()),
  notes: emptyToNull.pipe(z.string().max(2000).nullable()),
});

export type CustomerInput = z.infer<typeof customerSchema>;
