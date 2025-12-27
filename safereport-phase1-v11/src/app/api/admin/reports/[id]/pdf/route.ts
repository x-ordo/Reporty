export const runtime = "nodejs";

import crypto from "node:crypto";
import { z } from "zod";
import { asc, desc, eq, and, inArray } from "drizzle-orm";
import { Client } from "@upstash/qstash";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { env } from "@/server/env";
import { putText } from "@/server/storage";
import { verifyEvidenceChain } from "@/server/evidence-verify";
import { buildDefensePackHtml } from "@/server/pdf-template";
import { signDefensePack } from "@/server/pack-signature";

const Body = z.object({
  reason: z.string().min(2).max(60)
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  if (!env.QSTASH_TOKEN || !env.PDF_LAMBDA_FUNCTION_URL) {
    return Response.json({
      error: "pdf_not_configured",
      hint: "Set QSTASH_TOKEN and PDF_LAMBDA_FUNCTION_URL in env"
    }, { status: 500 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const reportId = params.id;

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, reportId)
  });
  if (!report) return Response.json({ error: "not_found" }, { status: 404 });
// Idempotency: if there is already a queued/generating pack created recently, return it (prevents duplicate costs).
const pendingRows = await db.select({
  id: schema.defensePacks.id,
  status: schema.defensePacks.status,
  createdAt: schema.defensePacks.createdAt
})
.from(schema.defensePacks)
.where(and(
  eq(schema.defensePacks.reportId, reportId),
  inArray(schema.defensePacks.status, ["queued", "generating"])
))
.orderBy(desc(schema.defensePacks.createdAt))
.limit(1);

if (pendingRows.length > 0) {
  const ageMs = Date.now() - new Date(pendingRows[0].createdAt as any).getTime();
  // If the pending request is fresh (< 10 minutes), dedupe. If it's stale, allow a new attempt.
  if (ageMs < 10 * 60 * 1000) {
    return Response.json({ ok: true, packId: pendingRows[0].id, status: pendingRows[0].status, deduped: true });
  }
}



  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, report.tenantId)
  });

  const events = await db.query.reportEvents.findMany({
    where: eq(schema.reportEvents.reportId, reportId),
    orderBy: [asc(schema.reportEvents.createdAt)]
  });

  const chain = await db.query.evidenceChain.findFirst({
    where: eq(schema.evidenceChain.reportId, reportId)
  });
  if (!chain) return Response.json({ error: "missing_chain" }, { status: 500 });

  const packId = crypto.randomUUID();
  const generatedAtISO = new Date().toISOString();
  const htmlKey = `packs/${report.tenantId}/${reportId}/${packId}.html`;

  // Evidence snapshot at generation time
  const verify = await verifyEvidenceChain(reportId);

  const snapshotPayload = {
    packId,
    reportId,
    tenantId: report.tenantId,
    generatedAtISO,
    storedHead: verify.storedHead,
    computedHead: verify.computedHead,
    events: verify.events,
    ok: verify.ok
  };

  const signature = signDefensePack(JSON.stringify(snapshotPayload));

  const html = buildDefensePackHtml({
    tenantName: tenant?.name ?? "Unknown Tenant",
    reportId,
    packId,
    status: report.status,
    subject: report.subject,
    category: report.category,
    createdAtISO: report.createdAt.toISOString(),
    events: events.map((e) => ({
      type: e.type,
      createdAtISO: e.createdAt.toISOString(),
      actorRole: e.actorRole,
      data: e.data
    })),
    evidenceHeadHash: chain.headHash,
    verify: {
      ok: verify.ok,
      storedHead: verify.storedHead,
      computedHead: verify.computedHead,
      events: verify.events,
      mismatch: verify.mismatch
    },
    signature,
    generatedAtISO
  });

  // Create pack record first (so we can finalize later via callback)
  await db.insert(schema.defensePacks).values({
    id: packId,
    reportId,
    tenantId: report.tenantId,
    status: "queued",
    reasonCode: parsed.data.reason,
    htmlKey,
    verifyOk: verify.ok,
    storedHead: verify.storedHead,
    computedHead: verify.computedHead,
    eventsCount: verify.events,
    mismatch: verify.mismatch,
    snapshotPayload,
    signature
  });

  // Persist HTML to object storage (R2)
  try {
    await putText(htmlKey, html, "text/html; charset=utf-8");
  } catch (e: any) {
    await db.update(schema.defensePacks).set({
      status: "failed",
      mismatch: { error: String(e?.message ?? e) },
      updatedAt: new Date()
    } as any).where(eq(schema.defensePacks.id, packId));

    return Response.json({ error: "storage_failed" }, { status: 500 });
  }

  // Access audit
  await db.insert(schema.accessAudit).values({
    reportId,
    actorId: null,
    actorRole: "admin",
    action: "pdf",
    reasonCode: parsed.data.reason,
    meta: { packId, htmlKey, signature, verifyOk: verify.ok }
  });

  // Enqueue Lambda generation via QStash
  const qstash = new Client({ token: env.QSTASH_TOKEN });
  try {
    await qstash.publishJSON({
      url: env.PDF_LAMBDA_FUNCTION_URL,
      body: {
        tenantId: report.tenantId,
        reportId,
        htmlKey,
        packId,
        signature
      },
      deduplicationId: `pdf:${report.tenantId}:${reportId}:${packId}`
    });
  } catch (e: any) {
    await db.update(schema.defensePacks).set({
      status: "failed",
      mismatch: { error: "qstash_publish_failed", detail: String(e?.message ?? e) },
      updatedAt: new Date()
    } as any).where(eq(schema.defensePacks.id, packId));

    return Response.json({ error: "enqueue_failed" }, { status: 500 });
  }

  return Response.json({ ok: true, packId, htmlKey, signature });
}
