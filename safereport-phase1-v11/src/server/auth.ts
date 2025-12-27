import { env } from "./env";
import { db, schema } from "./db";
import { makePartnerKeyHash } from "./crypto";
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
  const hash = makePartnerKeyHash(key);
  const partner = await db.query.partners.findFirst({
    where: eq(schema.partners.apiKeyHash, hash)
  });
  if (!partner) {
    return { ok: false as const, response: new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }) };
  }
  return { ok: true as const, partner };
}
