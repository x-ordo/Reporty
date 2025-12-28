import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import process from "node:process";
import { makePartnerKeyHash } from "../src/server/crypto.ts";

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const sql = neon(must("DATABASE_URL"));

const partnerName = process.env.SEED_PARTNER_NAME || "Demo Labor Attorney Group";
const tenantName = process.env.SEED_TENANT_NAME || "Demo SME (Tenant)";

const partnerId = process.env.SEED_PARTNER_ID || crypto.randomUUID();
const tenantId = process.env.SEED_TENANT_ID || crypto.randomUUID();

const partnerKey = process.env.SEED_PARTNER_KEY || ("prk_" + crypto.randomBytes(24).toString("base64url"));
const keyPrefix = partnerKey.slice(0, 8);


const inviteCode = (process.env.SEED_INVITE_CODE || "IRONDEMO")
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "")
  .slice(0, 12);

async function main() {
  const partnerKeyHash = await makePartnerKeyHash(partnerKey);

  await sql`
    INSERT INTO partners (id, name, invite_code, api_key_hash, key_prefix, revenue_share_rate, updated_at)
    VALUES (${partnerId}::uuid, ${partnerName}, ${inviteCode}, ${partnerKeyHash}, ${keyPrefix}, 0.00, now())
    ON CONFLICT (id) DO UPDATE SET 
      api_key_hash = ${partnerKeyHash},
      key_prefix = ${keyPrefix},
      updated_at = now()
  `;

  await sql`
    INSERT INTO tenants (id, partner_id, name, is_premium)
    VALUES (${tenantId}::uuid, ${partnerId}::uuid, ${tenantName}, false)
    ON CONFLICT (id) DO NOTHING
  `;

  console.log("✅ Seed complete");
  console.log("partnerId =", partnerId);
  console.log("tenantId  =", tenantId);
  console.log("inviteCode=", inviteCode);
  console.log("partnerKey =", partnerKey);
  console.log("");
  console.log("Use this tenantId for POST /api/public/reports");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});