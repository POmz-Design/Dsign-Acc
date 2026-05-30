"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { items, type Item } from "@/lib/db/schema";
import { itemSchema } from "@/lib/validation/item";
import { requireCompany } from "@/lib/queries/company";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function formDataToItemInput(formData: FormData): Record<string, unknown> {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    unit: formData.get("unit") ?? "ชิ้น",
    unitPrice: formData.get("unitPrice"),
    vatApplicable: formData.get("vatApplicable") === "on" ||
      formData.get("vatApplicable") === "true",
    whtRate: formData.get("whtRate"),
    isActive: formData.get("isActive") === "on" ||
      formData.get("isActive") === "true",
  };
}

export async function getItems(): Promise<Item[]> {
  const { company } = await requireCompany();
  if (!company) return [];
  return db.query.items.findMany({
    where: eq(items.companyId, company.id),
    orderBy: [asc(items.name)],
  });
}

export async function createItem(
  formData: FormData,
): Promise<ActionResult<Item>> {
  const { company } = await requireCompany();
  if (!company) return { success: false, error: "noCompany" };

  const parsed = itemSchema.safeParse(formDataToItemInput(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [row] = await db
      .insert(items)
      .values({ ...parsed.data, companyId: company.id })
      .returning();
    revalidatePath("/", "layout");
    return { success: true, data: row };
  } catch {
    return { success: false, error: "generic" };
  }
}

export async function updateItem(
  id: string,
  formData: FormData,
): Promise<ActionResult<Item>> {
  const { company } = await requireCompany();
  if (!company) return { success: false, error: "noCompany" };

  const parsed = itemSchema.safeParse(formDataToItemInput(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [row] = await db
      .update(items)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(items.id, id), eq(items.companyId, company.id)))
      .returning();
    if (!row) return { success: false, error: "notFound" };
    revalidatePath("/", "layout");
    return { success: true, data: row };
  } catch {
    return { success: false, error: "generic" };
  }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const { company } = await requireCompany();
  if (!company) return { success: false, error: "noCompany" };

  try {
    const result = await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.companyId, company.id)))
      .returning({ id: items.id });
    if (result.length === 0) return { success: false, error: "notFound" };
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "generic" };
  }
}
