import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import React from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, whtCertificates } from "@/lib/db/schema";
import { WhtCertificatePDF } from "@/components/pdf/wht-certificate-pdf";
import type { WhtCertificatePdfData } from "@/components/pdf/wht-certificate-pdf";
import type {
  CompanySnapshot,
  CustomerSnapshot,
} from "@/lib/documents/types";
import type {
  WhtFormType,
  WhtIncomeLine,
  WhtPaymentMethod,
} from "@/lib/documents/wht-types";

// @react-pdf/renderer needs Node APIs (Buffer, streams, fs for fonts).
export const runtime = "nodejs";
// Auth + DB make this dynamic per request.
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await ctx.params;

  const cert = await db.query.whtCertificates.findFirst({
    where: eq(whtCertificates.id, id),
  });
  if (!cert) {
    return new NextResponse("Not found", { status: 404 });
  }
  // Verify the cert's company belongs to the current user. 404 (not 403)
  // to avoid leaking existence cross-tenant — mirrors the docs PDF route.
  const company = await db.query.companies.findFirst({
    where: and(eq(companies.id, cert.companyId), eq(companies.userId, userId)),
  });
  if (!company) {
    return new NextResponse("Not found", { status: 404 });
  }

  const data: WhtCertificatePdfData = {
    runningNumber: cert.runningNumber,
    formType: cert.formType as WhtFormType,
    year: cert.year,
    paymentDate: cert.paymentDate,
    paymentMethod: cert.paymentMethod as WhtPaymentMethod,
    notes: cert.notes,
    totalGross: Number(cert.totalGross),
    totalWithheld: Number(cert.totalWithheld),
    company: cert.companySnapshot as CompanySnapshot,
    customer: cert.customerSnapshot as CustomerSnapshot,
    lines: cert.incomeTypes as WhtIncomeLine[],
  };

  const nodeStream = await renderToStream(
    React.createElement(WhtCertificatePDF, { data }),
  );

  // Node Readable → Web ReadableStream (Node 20+).
  const webStream = Readable.toWeb(
    nodeStream as unknown as Readable,
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cert.runningNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
