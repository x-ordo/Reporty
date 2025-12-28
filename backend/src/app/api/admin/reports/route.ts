export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { desc, eq, and } from "drizzle-orm";
import { z } from "zod";

const Query = z.object({
  tenantId: z.string().uuid().optional(),
  status: z.string().max(30).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = Query.safeParse({
    tenantId: url.searchParams.get("tenantId") || undefined,
    status: url.searchParams.get("status") || undefined,
    limit: url.searchParams.get("limit") || undefined
  });

  if (!parsed.success) {
    return Response.json({ error: "bad_query", details: parsed.error.flatten() }, { status: 400 });
  }

  const { tenantId, status, limit } = parsed.data;

  const conditions = [];
  if (tenantId) conditions.push(eq(schema.reports.tenantId, tenantId));
  if (status) conditions.push(eq(schema.reports.status, status));

  const base = db.select({
    id: schema.reports.id,
    tenantId: schema.reports.tenantId,
    status: schema.reports.status,
    subject: schema.reports.subject,
    category: schema.reports.category,
    createdAt: schema.reports.createdAt,
    lastViewedAt: schema.reports.lastViewedAt
  }).from(schema.reports);

  const q = conditions.length ? base.where(and(...conditions)) : base;
  const rows = await q.orderBy(desc(schema.reports.createdAt)).limit(limit ?? 50);

  return Response.json({ ok: true, items: rows });
}
