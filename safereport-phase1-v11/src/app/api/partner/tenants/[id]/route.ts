export const runtime = "nodejs";

import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { requirePartner } from "@/server/auth";
import { db, schema } from "@/server/db";

const Patch = z.object({
  partnerNotes: z.string().max(4000).optional().nullable(),
  tags: z.array(z.string().min(1).max(24)).max(20).optional()
});

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const auth = await requirePartner(req);
  if (!auth.ok) return auth.response;

  const tenantId = ctx.params.id;
  const json = await req.json().catch(() => null);
  const parsed = Patch.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const tenant = await db.query.tenants.findFirst({
    where: and(eq(schema.tenants.id, tenantId), eq(schema.tenants.partnerId, auth.partner.id))
  });
  if (!tenant) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  await db
    .update(schema.tenants)
    .set({
      partnerNotes: parsed.data.partnerNotes === undefined ? tenant.partnerNotes : parsed.data.partnerNotes,
      tags: parsed.data.tags === undefined ? (tenant.tags as any) : parsed.data.tags,
      updatedAt: new Date()
    })
    .where(eq(schema.tenants.id, tenantId));

  return Response.json({ ok: true });
}
