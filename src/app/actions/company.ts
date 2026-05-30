"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, type Company } from "@/lib/db/schema";
import { companySchema } from "@/lib/validation/company";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function formDataToCompanyInput(formData: FormData): Record<string, unknown> {
  return {
    nameTh: formData.get("nameTh"),
    nameEn: formData.get("nameEn"),
    tin: formData.get("tin"),
    branchCode: formData.get("branchCode") ?? "00000",
    addressTh: formData.get("addressTh"),
    addressEn: formData.get("addressEn"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    logoUrl: formData.get("logoUrl"),
    signatureUrl: formData.get("signatureUrl"),
    defaultVatRate: formData.get("defaultVatRate") ?? "7.00",
    defaultCurrency: formData.get("defaultCurrency") ?? "THB",
  };
}

export async function getCompany(): Promise<Company | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const row = await db.query.companies.findFirst({
    where: eq(companies.userId, session.user.id),
  });
  return row ?? null;
}

export async function saveCompany(
  formData: FormData,
): Promise<ActionResult<Company>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }
  const userId = session.user.id;

  const parsed = companySchema.safeParse(formDataToCompanyInput(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const now = new Date();

  try {
    const existing = await db.query.companies.findFirst({
      where: eq(companies.userId, userId),
    });

    let row: Company;
    if (existing) {
      const [updated] = await db
        .update(companies)
        .set({ ...input, updatedAt: now })
        .where(eq(companies.userId, userId))
        .returning();
      row = updated;
    } else {
      const [inserted] = await db
        .insert(companies)
        .values({ ...input, userId, createdAt: now, updatedAt: now })
        .returning();
      row = inserted;
    }

    // Revalidate every route that depends on the company (used by the
    // onboarding guard and the topbar / sidebar).
    revalidatePath("/", "layout");

    return { success: true, data: row };
  } catch {
    return { success: false, error: "generic" };
  }
}
