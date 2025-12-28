export const runtime = "nodejs";

import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";

const Patch = z.object({
  name: z.string().min(2).max(120).optional(),
  isPremium: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(24)).max(20).optional(),
  adminNotes: z.string().max(8000).optional().nullable(),
  slaPolicy: z
    .object({
      receivedHours: z.number().int().min(1).max(168).optional(),
      openDays: z.number().int().min(1).max(365).optional(),
      receivedHoursStrict: z.number().int().min(1).max(168).optional(),
      openDaysStrict: z.number().int().min(1).max(365).optional(),
      strictHints: z.array(z.string().min(1).max(20)).max(30).optional()
    })
    .partial()
    .optional()
});

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const tenantId = ctx.params.id;
  const json = await req.json().catch(() => null);
  const parsed = Patch.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId)
  });
  if (!tenant) return Response.json({ error: "not_found" }, { status: 404 });

  await db
    .update(schema.tenants)
    .set({
      name: parsed.data.name ?? tenant.name,
      isPremium: parsed.data.isPremium ?? tenant.isPremium,
      tags: parsed.data.tags ?? (tenant.tags as any),
      adminNotes: parsed.data.adminNotes === undefined ? tenant.adminNotes : parsed.data.adminNotes,
      slaPolicy: parsed.data.slaPolicy ? { ...(tenant.slaPolicy as any), ...parsed.data.slaPolicy } : (tenant.slaPolicy as any),
      updatedAt: new Date()
    })
    .where(eq(schema.tenants.id, tenantId));

  return Response.json({ ok: true });
}
