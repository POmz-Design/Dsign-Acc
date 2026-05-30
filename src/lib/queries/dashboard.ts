import "server-only";

import { and, desc, eq, gte, lt, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { documents, whtCertificates, type DocType } from "@/lib/db/schema";
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

// -------------------- Phase 5: dashboard widgets --------------------

export type RecentDocument = {
  id: string;
  type: DocType | "wht";
  runningNumber: string;
  customerName: string;
  issueDate: string;
  total: number;
  status: string;
  currency: string;
  createdAt: Date;
};

/**
 * The most-recent N issued documents *across both tables* — quotations,
 * invoices, receipts, AND WHT certificates. We fetch `limit` from each
 * table, merge, sort by createdAt desc, and slice. Cheap at the volumes
 * a single tenant produces in Phase 5.
 *
 * Ordered by createdAt rather than issueDate so back-dated docs don't
 * push fresh activity off the list.
 */
export async function getRecentDocuments(
  limit = 10,
): Promise<RecentDocument[]> {
  const { company } = await requireCompany();
  if (!company) return [];

  const [docRows, whtRows] = await Promise.all([
    db.query.documents.findMany({
      where: eq(documents.companyId, company.id),
      orderBy: [desc(documents.createdAt)],
      limit,
    }),
    db.query.whtCertificates.findMany({
      where: eq(whtCertificates.companyId, company.id),
      orderBy: [desc(whtCertificates.createdAt)],
      limit,
    }),
  ]);

  const merged: RecentDocument[] = [
    ...docRows.map((r) => {
      const snap = r.customerSnapshot as { name?: string };
      return {
        id: r.id,
        type: r.type as DocType,
        runningNumber: r.runningNumber,
        customerName: snap?.name ?? "—",
        issueDate: r.issueDate,
        total: Number(r.total),
        status: r.status,
        currency: r.currency,
        createdAt: r.createdAt,
      };
    }),
    ...whtRows.map((r) => {
      const snap = r.customerSnapshot as { name?: string };
      return {
        id: r.id,
        type: "wht" as const,
        runningNumber: r.runningNumber,
        customerName: snap?.name ?? "—",
        issueDate: r.paymentDate,
        total: Number(r.totalWithheld),
        status: r.status,
        currency: "THB",
        createdAt: r.createdAt,
      };
    }),
  ];

  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return merged.slice(0, limit);
}

export type TopCustomer = {
  name: string;
  total: number;
  invoiceCount: number;
};

/**
 * Top customers this month by invoice total (sum of `total`, not
 * `netPayable` — we want to surface gross customer value, not the cashflow
 * impact of WHT).
 */
export async function getTopCustomersThisMonth(
  limit = 5,
): Promise<TopCustomer[]> {
  const { company } = await requireCompany();
  if (!company) return [];

  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const startOfNextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const startIso = startOfMonth.toISOString().slice(0, 10);
  const endIso = startOfNextMonth.toISOString().slice(0, 10);

  const rows = await db
    .select({
      customerSnapshot: documents.customerSnapshot,
      total: documents.total,
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

  // Group in JS — the snapshot lives in JSONB and projecting into a typed
  // GROUP BY would need an awkward expression. Volume per company per month
  // is small enough that this is fine.
  const tally = new Map<string, TopCustomer>();
  for (const r of rows) {
    const snap = r.customerSnapshot as { name?: string };
    const name = snap?.name ?? "—";
    const prev = tally.get(name);
    if (prev) {
      prev.total += Number(r.total);
      prev.invoiceCount += 1;
    } else {
      tally.set(name, {
        name,
        total: Number(r.total),
        invoiceCount: 1,
      });
    }
  }

  return Array.from(tally.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export type MonthlyTrendPoint = {
  // ISO yyyy-mm — useful for stable React keys and for the locale formatter.
  yearMonth: string;
  total: number;
};

/**
 * Last N calendar months including the current one. Always returns N
 * points — months with no invoices show as zero so the chart axis stays
 * stable across renders.
 */
export async function getMonthlyInvoiceTrend(
  months = 6,
): Promise<MonthlyTrendPoint[]> {
  const { company } = await requireCompany();
  if (!company) return [];
  if (months < 1) return [];

  const now = new Date();
  // Beginning of the earliest month in the window.
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);

  const rows = await db
    .select({
      issueDate: documents.issueDate,
      total: documents.total,
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

  // Seed the trend with zeros for every month in the window so empty
  // months still produce a bar.
  const trend: MonthlyTrendPoint[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1),
    );
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    trend.push({ yearMonth: ym, total: 0 });
  }
  const idx = new Map(trend.map((p, i) => [p.yearMonth, i]));
  for (const r of rows) {
    // issueDate is a "YYYY-MM-DD" string — slice straight to YYYY-MM.
    const ym = r.issueDate.slice(0, 7);
    const i = idx.get(ym);
    if (i !== undefined) trend[i].total += Number(r.total);
  }
  return trend;
}
