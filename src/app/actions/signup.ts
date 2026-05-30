"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    locale: z.enum(["th", "en"]).default("th"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

export type SignupResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "exists" | "mismatch" | "generic" };

export async function signupAction(formData: FormData): Promise<SignupResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    locale: formData.get("locale") ?? "th",
  });

  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (i) => i.path[0] === "confirmPassword",
    );
    return { ok: false, error: mismatch ? "mismatch" : "invalid" };
  }

  const { email, password, locale } = parsed.data;

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (existing) return { ok: false, error: "exists" };

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insert(users).values({ email, hashedPassword, locale });

    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}
