export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { eq, desc, and, lt } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  // Mark stuck "queued" packs as failed (stale timeout) to prevent infinite "Generating" UX.
  const staleCutoff = new Date(Date.now() - 15 * 60 * 1000);
  await db.update(schema.defensePacks)
    .set({ status: "failed", reasonCode: "stale_timeout", generatedAt: new Date() })
    .where(and(
      eq(schema.defensePacks.reportId, params.id),
      eq(schema.defensePacks.status, "queued"),
      lt(schema.defensePacks.createdAt, staleCutoff)
    ));

  const rows = await db.select({
    id: schema.defensePacks.id,
    status: schema.defensePacks.status,
    reasonCode: schema.defensePacks.reasonCode,
    htmlKey: schema.defensePacks.htmlKey,
    pdfPath: schema.defensePacks.pdfPath,
    verifyOk: schema.defensePacks.verifyOk,
    storedHead: schema.defensePacks.storedHead,
    computedHead: schema.defensePacks.computedHead,
    eventsCount: schema.defensePacks.eventsCount,
    signature: schema.defensePacks.signature,
    generatedAt: schema.defensePacks.generatedAt,
    createdAt: schema.defensePacks.createdAt
  }).from(schema.defensePacks)
    .where(eq(schema.defensePacks.reportId, params.id))
    .orderBy(desc(schema.defensePacks.createdAt))
    .limit(50);

  return Response.json({ ok: true, packs: rows });
}
