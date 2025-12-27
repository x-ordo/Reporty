import crypto from "node:crypto";
import { env } from "./env";
import { Buffer } from "node:buffer";

function getKey(): Buffer {
  const raw = env.EVIDENCE_HMAC_KEY;
  return raw.match(/^[0-9a-fA-F]+$/) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
}

/**
 * Creates a system signature for a given snapshot payload.
 * This is NOT public verifiable (key is server-side), but gives audit-grade integrity proof.
 */
export function signDefensePack(payload: string): string {
  const h = crypto.createHmac("sha256", getKey());
  h.update(payload);
  return h.digest("hex");
}