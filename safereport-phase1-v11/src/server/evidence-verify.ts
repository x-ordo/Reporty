import { db, schema } from "./db";
import { computeEventHash } from "./evidence";
import { eq, asc } from "drizzle-orm";

export type EvidenceVerifyResult = {
  ok: boolean;
  reportId: string;
  events: number;
  storedHead: string;
  computedHead: string | null;
  mismatch: null | {
    index: number;
    eventId: string;
    type: string;
    createdAtISO: string;
    expectedPrev: string | null;
    storedPrev: string | null;
    expectedHash: string;
    storedHash: string;
    prevOk: boolean;
    hashOk: boolean;
  };
};

export async function verifyEvidenceChain(reportId: string): Promise<EvidenceVerifyResult> {
  const chainRows = await db.select({
    headHash: schema.evidenceChain.headHash
  }).from(schema.evidenceChain).where(eq(schema.evidenceChain.reportId, reportId)).limit(1);

  if (chainRows.length === 0) {
    return {
      ok: false,
      reportId,
      events: 0,
      storedHead: "missing",
      computedHead: null,
      mismatch: {
        index: -1,
        eventId: "missing",
        type: "chain_missing",
        createdAtISO: new Date().toISOString(),
        expectedPrev: null,
        storedPrev: null,
        expectedHash: "missing",
        storedHash: "missing",
        prevOk: false,
        hashOk: false
      }
    };
  }

  const storedHead = chainRows[0].headHash;

  const events = await db.select({
    id: schema.reportEvents.id,
    type: schema.reportEvents.type,
    actorRole: schema.reportEvents.actorRole,
    data: schema.reportEvents.data,
    dataCiphertext: schema.reportEvents.dataCiphertext,
    prevEventHash: schema.reportEvents.prevEventHash,
    eventHash: schema.reportEvents.eventHash,
    createdAt: schema.reportEvents.createdAt
  }).from(schema.reportEvents)
    .where(eq(schema.reportEvents.reportId, reportId))
    .orderBy(asc(schema.reportEvents.createdAt));

  if (events.length === 0) {
    return {
      ok: false,
      reportId,
      events: 0,
      storedHead,
      computedHead: null,
      mismatch: {
        index: 0,
        eventId: "none",
        type: "no_events",
        createdAtISO: new Date().toISOString(),
        expectedPrev: null,
        storedPrev: null,
        expectedHash: "missing",
        storedHash: "missing",
        prevOk: false,
        hashOk: false
      }
    };
  }

  let prev: string | null = null;
  let mismatch: EvidenceVerifyResult["mismatch"] = null;
  let computedLast: string | null = null;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const createdAtISO = e.createdAt.toISOString();

    const expectedPrev = prev;
    const expectedHash = computeEventHash({
      reportId,
      type: e.type,
      actorRole: e.actorRole,
      data: (e.data ?? {}) as Record<string, unknown>,
      createdAtISO
    }, expectedPrev);

    const prevOk = (e.prevEventHash ?? null) === expectedPrev;
    const hashOk = e.eventHash === expectedHash;

    if (!prevOk || !hashOk) {
      mismatch = {
        index: i,
        eventId: e.id,
        type: e.type,
        createdAtISO,
        expectedPrev,
        storedPrev: e.prevEventHash ?? null,
        expectedHash,
        storedHash: e.eventHash,
        prevOk,
        hashOk
      };
      break;
    }

    prev = expectedHash;
    computedLast = expectedHash;
  }

  const ok = mismatch === null && computedLast === storedHead;

  return {
    ok,
    reportId,
    events: events.length,
    storedHead,
    computedHead: computedLast,
    mismatch
  };
}
