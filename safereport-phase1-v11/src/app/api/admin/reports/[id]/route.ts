export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const id = params.id;
  const rows = await db.select({
    id: schema.reports.id,
    tenantId: schema.reports.tenantId,
    status: schema.reports.status,
    subject: schema.reports.subject,
    category: schema.reports.category,
    createdAt: schema.reports.createdAt,
    lastViewedAt: schema.reports.lastViewedAt
  }).from(schema.reports).where(eq(schema.reports.id, id)).limit(1);

  if (rows.length === 0) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json({ ok: true, report: rows[0] });
}
