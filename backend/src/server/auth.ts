import { env } from "./env";
import { db, schema } from "./db";
import { comparePartnerKey } from "./crypto";
import { eq } from "drizzle-orm";

export function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_API_KEY) {
    return { ok: false as const, response: new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }) };
  }
  return { ok: true as const };
}

export async function requirePartner(req: Request) {
  const key = req.headers.get("x-partner-key");
  if (!key) {
    return { ok: false as const, response: new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }) };
  }

  const prefix = key.slice(0, 8);
  const partner = await db.query.partners.findFirst({
    where: eq(schema.partners.keyPrefix, prefix)
  });

  if (!partner) {
    return { ok: false as const, response: new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }) };
  }

  const keyMatches = await comparePartnerKey(key, partner.apiKeyHash);
  if (!keyMatches) {
    return { ok: false as const, response: new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }) };
  }

  return { ok: true as const, partner };
}
