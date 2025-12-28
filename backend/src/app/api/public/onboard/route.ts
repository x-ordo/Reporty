export const runtime = "nodejs";

import crypto from "node:crypto";
import { db, schema } from "@/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Body = z.object({
  inviteCode: z.string().min(4).max(30).transform(v => v.trim().toUpperCase()),
  tenantName: z.string().min(2).max(120)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const partner = await db.query.partners.findFirst({
    where: eq(schema.partners.inviteCode, parsed.data.inviteCode)
  });
  if (!partner) return Response.json({ error: "invalid_invite" }, { status: 404 });

  const tenantId = crypto.randomUUID();
  await db.insert(schema.tenants).values({
    id: tenantId,
    partnerId: partner.id,
    name: parsed.data.tenantName,
    isPremium: false,
    createdAt: new Date()
  });

  return Response.json({
    ok: true,
    partnerName: partner.name,
    tenantId,
    intakeUrl: `/r/${tenantId}`
  }, { status: 201 });
}
