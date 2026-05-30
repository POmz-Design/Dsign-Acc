import "server-only";

import { and, eq, gte, lt, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { requireCompany } from "./company";

export type DashboardStats = {
  invoicesCount: number;
  invoicesTotal: number;
  vatCollected: number;
  whtWithheld: number;
  outstanding: number;
};

/**
 * Aggregates invoice numbers for the current calendar month. We pull all
 * matching rows and reduce in JS — easier than COALESCE/SUM gymnastics and
 * the volume per company is small at this stage. Revisit if a single
 * tenant ever issues thousands of invoices per month.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { company } = await requireCompany();
  if (!company) {
    return {
      invoicesCount: 0,
      invoicesTotal: 0,
      vatCollected: 0,
      whtWithheld: 0,
      outstanding: 0,
    };
  }

  // Month bounds in ISO date strings — `documents.issueDate` is stored as
  // `date`, so string comparison works correctly.
  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const startIso = startOfMonth.toISOString().slice(0, 10);
  const endIso = startOfNextMonth.toISOString().slice(0, 10);

  // This-month invoices. Voided rows are excluded from every aggregate —
  // they didn't really happen as far as the user's books are concerned.
  const monthInvoices = await db
    .select({
      total: documents.total,
      vatAmount: documents.vatAmount,
      whtAmount: documents.whtAmount,
    })
    .from(documents)
    .where(
      and(
        eq(documents.companyId, company.id),
        eq(documents.type, "invoice"),
        ne(documents.status, "void"),
        gte(documents.issueDate, startIso),
        lt(documents.issueDate, endIso),
      ),
    );

  // Outstanding spans all time, not just this month.
  const outstandingRows = await db
    .select({ netPayable: documents.netPayable })
    .from(documents)
    .where(
      and(
        eq(documents.companyId, company.id),
        eq(documents.type, "invoice"),
        eq(documents.status, "issued"),
      ),
    );

  const invoicesCount = monthInvoices.length;
  const invoicesTotal = monthInvoices.reduce(
    (s, r) => s + Number(r.total),
    0,
  );
  const vatCollected = monthInvoices.reduce(
    (s, r) => s + Number(r.vatAmount),
    0,
  );
  const whtWithheld = monthInvoices.reduce(
    (s, r) => s + Number(r.whtAmount),
    0,
  );
  const outstanding = outstandingRows.reduce(
    (s, r) => s + Number(r.netPayable),
    0,
  );

  return {
    invoicesCount,
    invoicesTotal,
    vatCollected,
    whtWithheld,
    outstanding,
  };
}
