"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers, type Customer } from "@/lib/db/schema";
import { customerSchema } from "@/lib/validation/customer";
import { requireCompany } from "@/lib/queries/company";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function formDataToCustomerInput(formData: FormData): Record<string, unknown> {
  return {
    name: formData.get("name"),
    tin: formData.get("tin"),
    branchCode: formData.get("branchCode"),
    isJuristic: formData.get("isJuristic") === "on" ||
      formData.get("isJuristic") === "true",
    address: formData.get("address"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const { company } = await requireCompany();
  if (!company) return [];
  return db.query.customers.findMany({
    where: eq(customers.companyId, company.id),
    orderBy: [asc(customers.name)],
  });
}

export async function createCustomer(
  formData: FormData,
): Promise<ActionResult<Customer>> {
  const { company } = await requireCompany();
  if (!company) return { success: false, error: "noCompany" };

  const parsed = customerSchema.safeParse(formDataToCustomerInput(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [row] = await db
      .insert(customers)
      .values({ ...parsed.data, companyId: company.id })
      .returning();
    revalidatePath("/", "layout");
    return { success: true, data: row };
  } catch {
    return { success: false, error: "generic" };
  }
}

export async function updateCustomer(
  id: string,
  formData: FormData,
): Promise<ActionResult<Customer>> {
  const { company } = await requireCompany();
  if (!company) return { success: false, error: "noCompany" };

  const parsed = customerSchema.safeParse(formDataToCustomerInput(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [row] = await db
      .update(customers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.companyId, company.id)))
      .returning();
    if (!row) return { success: false, error: "notFound" };
    revalidatePath("/", "layout");
    return { success: true, data: row };
  } catch {
    return { success: false, error: "generic" };
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const { company } = await requireCompany();
  if (!company) return { success: false, error: "noCompany" };

  try {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.companyId, company.id)))
      .returning({ id: customers.id });
    if (result.length === 0) return { success: false, error: "notFound" };
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "generic" };
  }
}
