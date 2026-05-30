import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { documentCounters } from "@/lib/db/schema";
import { DOC_TYPE_PREFIX, type DocType } from "./types";

// Always called from inside `db.transaction(async tx => …)`. We pull the
// `tx` type out of `db.transaction` so this keeps working if the
// underlying driver changes.
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Atomically claim the next running number for `(companyId, docType, year)`.
 *
 * Uses Postgres `INSERT … ON CONFLICT DO UPDATE … RETURNING` to avoid an
 * explicit row lock. Two concurrent calls serialize on the conflicting
 * tuple, so neither can read the same `nextValue`.
 *
 * Pass the active tx so the bump happens in the same transaction that
 * inserts the document — if the document insert fails the counter rolls
 * back too.
 */
export async function nextRunningNumber(
  tx: Tx,
  companyId: string,
  docType: DocType,
  year: number,
): Promise<string> {
  // Drizzle's `onConflictDoUpdate` lets us pass an `excluded`-style update
  // by computing the new value from the existing row.
  const [row] = await tx
    .insert(documentCounters)
    .values({ companyId, docType, year, nextValue: 2 })
    .onConflictDoUpdate({
      target: [
        documentCounters.companyId,
        documentCounters.docType,
        documentCounters.year,
      ],
      // `nextValue + 1` (current claim is the existing value; we return it
      // and persist current+1 for the next caller).
      set: { nextValue: sql`${documentCounters.nextValue} + 1` },
    })
    .returning({ nextValue: documentCounters.nextValue });

  // On first insert: row.nextValue = 2, claimed = 1.
  // On conflict update: row.nextValue is post-increment value, claimed is
  // post-increment - 1.
  const claimed = row.nextValue - 1;
  const padded = String(claimed).padStart(5, "0");
  return `${DOC_TYPE_PREFIX[docType]}-${year}-${padded}`;
}
