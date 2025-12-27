export const runtime = "nodejs";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const rows = await db
    .select({
      id: schema.tenants.id,
      name: schema.tenants.name,
      isPremium: schema.tenants.isPremium,
      partnerId: schema.tenants.partnerId,
      partnerName: schema.partners.name,
      tags: schema.tenants.tags,
      adminNotes: schema.tenants.adminNotes,
      partnerNotes: schema.tenants.partnerNotes,
      slaPolicy: schema.tenants.slaPolicy,
      createdAt: schema.tenants.createdAt,
      updatedAt: schema.tenants.updatedAt
    })
    .from(schema.tenants)
    .leftJoin(schema.partners, eq(schema.tenants.partnerId, schema.partners.id))
    .orderBy(desc(schema.tenants.createdAt));

  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    isPremium: r.isPremium,
    partnerId: r.partnerId,
    partnerName: r.partnerName ?? null,
    tags: (r.tags as any) ?? [],
    adminNotes: r.adminNotes ?? null,
    partnerNotes: r.partnerNotes ?? null,
    slaPolicy: (r.slaPolicy as any) ?? {},
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));

  return Response.json({ ok: true, items });
}
