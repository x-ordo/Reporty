export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { decryptJson } from "@/server/crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Query = z.object({
  reason: z.string().min(2).max(60)
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return Response.json({ error: "missing_reason", details: parsed.error.flatten() }, { status: 400 });
  }

  const reportId = params.id;

  const payloadRows = await db.select({
    ciphertext: schema.reportPayloads.ciphertext,
    attachments: schema.reportPayloads.attachments
  }).from(schema.reportPayloads).where(eq(schema.reportPayloads.reportId, reportId)).limit(1);

  if (payloadRows.length === 0) return Response.json({ error: "not_found" }, { status: 404 });

  // access audit
  await db.insert(schema.accessAudit).values({
    reportId,
    actorId: null,
    actorRole: "admin",
    action: "view",
    reasonCode: parsed.data.reason,
    meta: { source: "admin_payload" }
  });

  await db.update(schema.reports)
    .set({ lastViewedAt: new Date() })
    .where(eq(schema.reports.id, reportId));

  const decrypted = decryptJson(payloadRows[0].ciphertext, payloadRows[0].encryptionKeyId ?? null);

  return Response.json({
    ok: true,
    payload: decrypted,
    attachments: payloadRows[0].attachments
  });
}
