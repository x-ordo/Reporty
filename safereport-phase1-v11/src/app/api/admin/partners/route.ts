export const runtime = "nodejs";

import crypto from "node:crypto";
import { requireAdmin } from "@/server/auth";
import { db, schema } from "@/server/db";
import { makePartnerKeyHash } from "@/server/crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const Create = z.object({
  name: z.string().min(2).max(120),
  revenueShareRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional()
});

function genInviteCode() {
  // IRON + 8 chars
  const rnd = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
  return ("IRON" + rnd).slice(0, 12);
}

function genPartnerKey() {
  // url-safe key for manual copy/paste
  return "prk_" + crypto.randomBytes(24).toString("base64url");
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const rows = await db.select({
    id: schema.partners.id,
    name: schema.partners.name,
    inviteCode: schema.partners.inviteCode,
    keyPrefix: schema.partners.keyPrefix,
    revenueShareRate: schema.partners.revenueShareRate,
    createdAt: schema.partners.createdAt
  }).from(schema.partners).orderBy(desc(schema.partners.createdAt));

  return Response.json({ ok: true, items: rows });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = Create.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const partnerKey = genPartnerKey();
  const apiKeyHash = makePartnerKeyHash(partnerKey);
  const keyPrefix = partnerKey.slice(0, 10);

  // ensure invite code unique (retry few times)
  let inviteCode = genInviteCode();
  for (let i = 0; i < 5; i++) {
    const exists = await db.query.partners.findFirst({ where: eq(schema.partners.inviteCode, inviteCode) });
    if (!exists) break;
    inviteCode = genInviteCode();
  }

  const id = crypto.randomUUID();

  await db.insert(schema.partners).values({
    id,
    name: parsed.data.name,
    inviteCode,
    apiKeyHash,
    keyPrefix,
    revenueShareRate: parsed.data.revenueShareRate ?? "0.00",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // partnerKey is returned ONCE
  return Response.json({
    ok: true,
    partner: { id, name: parsed.data.name, inviteCode, keyPrefix },
    partnerKey
  }, { status: 201 });
}
