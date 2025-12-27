export const runtime = "nodejs";

import { db, schema } from "@/server/db";
import { env } from "@/server/env";
import { z } from "zod";
import { eq } from "drizzle-orm";

const Body = z.object({
  packId: z.string().uuid(),
  reportId: z.string().uuid(),
  tenantId: z.string().uuid(),
  signature: z.string().min(32).max(128),

  ok: z.boolean(),
  pdfPath: z.string().min(1).optional(),
  error: z.string().max(500).optional()
});

export async function POST(req: Request) {
  const token = req.headers.get("x-pdf-callback-token") || "";
  if (!env.PDF_CALLBACK_TOKEN || token !== env.PDF_CALLBACK_TOKEN) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { packId, reportId, tenantId, signature, ok, pdfPath, error } = parsed.data;

  const pack = await db.query.defensePacks.findFirst({
    where: eq(schema.defensePacks.id, packId)
  });
  if (!pack) return Response.json({ error: "pack_not_found" }, { status: 404 });

  // Hard integrity checks: wrong report/tenant/signature => reject
  if (pack.reportId !== reportId || pack.tenantId !== tenantId || pack.signature !== signature) {
    return Response.json({ error: "mismatch" }, { status: 409 });
  }

  await db.update(schema.defensePacks)
    .set({
      status: ok ? "generated" : "failed",
      pdfPath: ok ? (pdfPath ?? null) : null,
      generatedAt: ok ? new Date() : null,
      updatedAt: new Date(),
      mismatch: ok ? pack.mismatch : { ...(pack.mismatch ?? {}), error: error ?? "unknown" }
    } as any)
    .where(eq(schema.defensePacks.id, packId));

  await db.insert(schema.accessAudit).values({
    reportId,
    actorId: null,
    actorRole: "system",
    action: ok ? "pdf_completed" : "pdf_failed",
    reasonCode: ok ? "lambda_callback" : "lambda_callback_error",
    meta: { packId, tenantId, pdfPath, error }
  });

  return Response.json({ ok: true });
}
