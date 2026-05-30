import "server-only";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, type Company } from "@/lib/db/schema";

/**
 * Resolves the authed user's company. Returns null when the user hasn't
 * onboarded yet (no row in `companies`). Callers decide whether to redirect
 * to the settings onboarding flow.
 *
 * Redirects to the login page when there is no session — this is a server
 * helper, so calling it from a page or action is safe.
 */
export async function requireCompany(): Promise<{
  userId: string;
  company: Company | null;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const company =
    (await db.query.companies.findFirst({
      where: eq(companies.userId, userId),
    })) ?? null;

  return { userId, company };
}

/**
 * Like `requireCompany` but throws when there is no company. Useful inside
 * server actions that are only reachable after onboarding.
 */
export async function requireCompanyOrFail(): Promise<{
  userId: string;
  company: Company;
}> {
  const { userId, company } = await requireCompany();
  if (!company) {
    throw new Error("NO_COMPANY");
  }
  return { userId, company };
}
