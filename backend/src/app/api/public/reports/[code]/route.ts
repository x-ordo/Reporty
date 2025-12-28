export const runtime = "nodejs";

import { db, schema } from "@/server/db";
import { makePublicCodeHash } from "@/server/crypto";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase().trim();
  if (!code || code.length < 6) {
    return Response.json({ error: "bad_code" }, { status: 400 });
  }

  const hash = makePublicCodeHash(code);
  const rows = await db.select({
    id: schema.reports.id,
    status: schema.reports.status,
    createdAt: schema.reports.createdAt,
    lastViewedAt: schema.reports.lastViewedAt
  }).from(schema.reports).where(eq(schema.reports.publicCodeHash, hash)).limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const r = rows[0];
  return Response.json({
    ok: true,
    status: r.status,
    createdAt: r.createdAt,
    viewed: !!r.lastViewedAt
  });
}
