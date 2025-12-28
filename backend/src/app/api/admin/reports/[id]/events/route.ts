export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { encryptJson, decryptJson, currentKeyId } from "@/server/crypto";
import { computeEventHash } from "@/server/evidence";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { EventCreateSchema, statusForEvent } from "@/server/event-templates";
import { assertNoPiiInObject } from "@/server/pii-guard";

const GetQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional()
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = GetQuery.safeParse({
    limit: url.searchParams.get("limit") || undefined
  });
  if (!parsed.success) return Response.json({ error: "bad_query", details: parsed.error.flatten() }, { status: 400 });

  const rows = await db.select({
    id: schema.reportEvents.id,
    type: schema.reportEvents.type,
    actorRole: schema.reportEvents.actorRole,
    data: schema.reportEvents.data,
    dataCiphertext: schema.reportEvents.dataCiphertext,
    dataKeyId: schema.reportEvents.dataKeyId,
    prevEventHash: schema.reportEvents.prevEventHash,
    eventHash: schema.reportEvents.eventHash,
    createdAt: schema.reportEvents.createdAt
  }).from(schema.reportEvents)
    .where(eq(schema.reportEvents.reportId, params.id))
    .orderBy(asc(schema.reportEvents.createdAt))
    .limit(parsed.data.limit ?? 100);

  const events = rows.map((r) => {
    let dataFull: any = null;
    let decryptError: string | null = null;
    if (r.dataCiphertext) {
      try {
        dataFull = decryptJson(r.dataCiphertext, r.dataKeyId ?? undefined);
      } catch (e: any) {
        decryptError = String(e?.message ?? e);
      }
    }
    return {
      id: r.id,
      type: r.type,
      actorRole: r.actorRole,
      data: r.data,
      dataFull,
      decryptError,
      prevEventHash: r.prevEventHash,
      eventHash: r.eventHash,
      createdAt: r.createdAt
    };
  });
  return Response.json({ ok: true, events });
}

function requireOneOf(data: Record<string, any>, keys: string[], err: string) {
  for (const k of keys) {
    const v = data?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return;
  }
  throw new Error(err);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const reportId = params.id;

  const reportKeyRows = await db.select({ encryptionKeyId: schema.reports.encryptionKeyId })
    .from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  const dataKeyId = reportKeyRows[0]?.encryptionKeyId ?? currentKeyId();

  const json = await req.json().catch(() => null);
  const parsed = EventCreateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const val = parsed.data;
  const dataFull = (val.data ?? {}) as Record<string, any>;
  const dataCiphertext = encryptJson(dataFull, dataKeyId);
  const data = {} as Record<string, any>; // keep JSONB metadata non-sensitive

  // Tripwire: prevent plaintext metadata from containing identifiers (emails/phones/names-with-titles etc).
  // Store narrative details in the encrypted payload instead.
  assertNoPiiInObject(dataFull, `report_events.data_full:${val.type}`);

  // Type-specific minimum required fields (practical, not academic)
  try {
    switch (val.type) {
      case "investigation_started":
        requireOneOf(dataFull, ["owner"], "Missing data.owner");
        break;
      case "protective_action":
        requireOneOf(dataFull, ["action"], "Missing data.action");
        break;
      case "fact_finding":
        requireOneOf(dataFull, ["evidenceSummary", "interviewCount"], "Missing data.evidenceSummary or data.interviewCount");
        break;
      case "action_decided":
        requireOneOf(dataFull, ["decision"], "Missing data.decision");
        break;
      case "action_executed":
        requireOneOf(dataFull, ["executionSummary"], "Missing data.executionSummary");
        break;
      case "prevention":
        requireOneOf(dataFull, ["measure"], "Missing data.measure");
        break;
      case "closed":
        requireOneOf(dataFull, ["outcome"], "Missing data.outcome");
        break;
      default:
        break;
    }
  } catch (e: any) {
    return Response.json({ error: "missing_fields", detail: String(e?.message ?? e) }, { status: 400 });
  }

  // current chain head
  const chain = await db.query.evidenceChain.findFirst({
    where: eq(schema.evidenceChain.reportId, reportId)
  });
  if (!chain) return Response.json({ error: "chain_missing" }, { status: 409 });

  const prevHash = chain.headHash ?? null;
  const createdAtISO = new Date().toISOString();

  const eventHash = computeEventHash({
    reportId,
    type: val.type,
    actorRole: "admin",
    data,
    dataCiphertext,
    createdAtISO
  }, prevHash);

  await db.insert(schema.reportEvents).values({
    reportId,
    type: val.type,
    actorRole: "admin",
    data,
    dataCiphertext,
    dataKeyId,
    prevEventHash: prevHash,
    eventHash,
    createdAt: new Date(createdAtISO)
  });

  await db.update(schema.evidenceChain)
    .set({ headHash: eventHash })
    .where(eq(schema.evidenceChain.reportId, reportId));

  const autoStatus = statusForEvent(val.type as any);
  const nextStatus = val.nextStatus ?? autoStatus ?? undefined;

  if (nextStatus) {
    await db.update(schema.reports)
      .set({ status: nextStatus })
      .where(eq(schema.reports.id, reportId));
  }

  await db.insert(schema.accessAudit).values({
    reportId,
    actorId: null,
    actorRole: "admin",
    action: "event",
    reasonCode: val.reason,
    meta: { type: val.type, nextStatus: nextStatus ?? null }
  });

  return Response.json({ ok: true, reportId, prevHash, eventHash, nextStatus: nextStatus ?? null });
}
