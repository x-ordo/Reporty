export const runtime = "nodejs";

import crypto from "node:crypto";
import { db, schema } from "@/server/db";
import { encryptJson, makePublicCode, makePublicCodeHash, currentKeyId } from "@/server/crypto";
import { computeEventHash } from "@/server/evidence";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Body = z.object({
  tenantId: z.string().uuid(),
  subject: z.string().max(200).optional(),
  category: z.string().max(80).optional(),
  message: z.string().min(10).max(4000),
  occurredAtISO: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  attachments: z.array(z.object({
    key: z.string().min(1),
    name: z.string().min(1).max(200),
    size: z.number().int().min(0).max(1_000_000_000).optional(),
    mime: z.string().max(120).optional()
  })).max(20).optional()
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { tenantId, subject, category, message, occurredAtISO, location, attachments } = parsed.data;

  const tenant = await db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
  if (tenant.length === 0) return Response.json({ error: "tenant_not_found" }, { status: 404 });

  const reportId = crypto.randomUUID();
  const code = makePublicCode();
  const publicCodeHash = makePublicCodeHash(code);

  const createdAtISO = new Date().toISOString();

  // Store report + encrypted payload + initial timeline event + chain head
  const encryptionKeyId = currentKeyId();

  // Initial timeline event: store only minimal JSONB, encrypt full metadata
  const receivedEventFull = { channel: "public", occurredAtISO, location };
  const receivedEventSafe = { channel: "public" };
  const receivedEventCiphertext = encryptJson(receivedEventFull, encryptionKeyId);
  const receivedEvent = {
    type: "received",
    createdAtISO,
    actorRole: "user",
    data: receivedEventSafe,
    dataCiphertext: receivedEventCiphertext
  };

  const eventHash = computeEventHash({ ...receivedEvent, reportId }, null);
  const headHash = eventHash;

  await db.insert(schema.reports).values({
    id: reportId,
    tenantId,
    status: "received",
    subject: subject ?? null,
    category: category ?? null,
    publicCodeHash,
    encryptionKeyId
  });

  const ciphertext = encryptJson({
    message,
    occurredAtISO,
    location,
    submittedAtISO: createdAtISO
  }, encryptionKeyId);

  await db.insert(schema.reportPayloads).values({
    reportId,
    ciphertext,
    attachments: attachments ?? []
  });

  await db.insert(schema.reportEvents).values({
    reportId,
    type: receivedEvent.type,
    actorRole: receivedEvent.actorRole,
    data: receivedEvent.data,
    dataCiphertext: receivedEvent.dataCiphertext,
    dataKeyId: encryptionKeyId,
    createdAt: new Date(createdAtISO),
    prevEventHash: null,
    eventHash
  });

  await db.insert(schema.evidenceChain).values({
    reportId,
    headHash
  });

  return Response.json({
    ok: true,
    reportId,
    code // user uses this to check status later (GET /api/public/reports/[code])
  }, { status: 201 });
}
