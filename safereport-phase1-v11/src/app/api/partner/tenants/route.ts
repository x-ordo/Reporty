export const runtime = "nodejs";

import crypto from "node:crypto";
import { z } from "zod";
import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { requirePartner } from "@/server/auth";
import { db, schema } from "@/server/db";
import { isUrgentReport } from "@/server/sla";

const Create = z.object({
  name: z.string().min(2).max(120)
});

export async function GET(req: Request) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.response;

  const tenants = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.partnerId, auth.partner.id))
    .orderBy(desc(schema.tenants.createdAt));

  const tenantIds = tenants.map((t) => t.id);

  const slaByTenant: Record<string, any> = {};
  for (const t of tenants) {
    slaByTenant[t.id] = (t.slaPolicy as any) ?? {};
  }


  const summaries: Record<
    string,
    { openCount: number; urgentCount: number; lastAt: string | null; traffic: "green" | "yellow" | "red" }
  > = {};

  if (tenantIds.length) {
    const openReports = await db
      .select({
        tenantId: schema.reports.tenantId,
        status: schema.reports.status,
        createdAt: schema.reports.createdAt,
        category: schema.reports.category
      })
      .from(schema.reports)
      .where(and(inArray(schema.reports.tenantId, tenantIds), ne(schema.reports.status, "closed")));

    const now = new Date();

    for (const r of openReports) {
      const key = r.tenantId;
      if (!summaries[key]) summaries[key] = { openCount: 0, urgentCount: 0, lastAt: null, traffic: "green" };
      summaries[key].openCount += 1;

      const urgent = isUrgentReport({
        status: r.status,
        createdAt: r.createdAt,
        category: r.category ?? null,
        policy: slaByTenant[key] ?? null,
        now
      });

      if (urgent) summaries[key].urgentCount += 1;

      const at = r.createdAt.toISOString();
      if (!summaries[key].lastAt || at > summaries[key].lastAt) summaries[key].lastAt = at;
    }
  }

  const items = tenants.map((t) => {
    const s = summaries[t.id] || { openCount: 0, urgentCount: 0, lastAt: null, traffic: "green" as const };
    const traffic: "green" | "yellow" | "red" = s.urgentCount > 0 ? "red" : s.openCount > 0 ? "yellow" : "green";
    return {
      id: t.id,
      name: t.name,
      isPremium: t.isPremium,
      createdAt: t.createdAt.toISOString(),
      tags: (t.tags as any) ?? [],
      adminNotes: t.adminNotes ?? null,
      partnerNotes: t.partnerNotes ?? null,
      slaPolicy: (t.slaPolicy as any) ?? {},

      openCount: s.openCount,
      urgentCount: s.urgentCount,
      lastAt: s.lastAt,
      traffic
    };
  });

  return Response.json({
    ok: true,
    pollAfterMs: 15000,
    partner: {
      id: auth.partner.id,
      name: auth.partner.name,
      inviteCode: auth.partner.inviteCode,
      keyPrefix: auth.partner.keyPrefix
    },
    items
  });
}

export async function POST(req: Request) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = Create.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await db.insert(schema.tenants).values({
    id,
    partnerId: auth.partner.id,
    name: parsed.data.name,
    isPremium: false,
    tags: [],
    slaPolicy: {},
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return Response.json({ ok: true, tenant: { id, name: parsed.data.name } }, { status: 201 });
}