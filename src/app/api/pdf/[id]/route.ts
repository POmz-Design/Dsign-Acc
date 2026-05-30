import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import React from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, documents } from "@/lib/db/schema";
import { DocumentPDF } from "@/components/pdf/document-pdf";
import type { DocumentPayload } from "@/lib/documents/types";

// Node runtime — @react-pdf/renderer requires Node APIs (Buffer, streams,
// fs for font loading). The default Next 15 runtime would otherwise pick
// Edge for static-ish routes and break.
export const runtime = "nodejs";
// Each request must run fresh — auth + DB.
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

  // Find document AND verify the company belongs to the current user.
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }
  const company = await db.query.companies.findFirst({
    where: and(eq(companies.id, doc.companyId), eq(companies.userId, userId)),
  });
  if (!company) {
    // Surfacing as 404 rather than 403 — don't leak existence cross-tenant.
    return new NextResponse("Not found", { status: 404 });
  }

  const payload = doc.jsonPayload as DocumentPayload;
  const nodeStream = await renderToStream(
    React.createElement(DocumentPDF, { payload }),
  );

  // @react-pdf/renderer returns a Node Readable. NextResponse needs a Web
  // ReadableStream — Node 20+ provides `Readable.toWeb` for the cast.
  const webStream = Readable.toWeb(
    nodeStream as unknown as Readable,
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.runningNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
