import crypto from "node:crypto";
import { env } from "./env";
import { Buffer } from "node:buffer";

function hmacHex(data: string, prevHash: string | null): string {
  const keyRaw = env.EVIDENCE_HMAC_KEY;
  const key = keyRaw.match(/^[0-9a-fA-F]+$/) ? Buffer.from(keyRaw, "hex") : Buffer.from(keyRaw, "base64");
  const h = crypto.createHmac("sha256", key);
  h.update(prevHash ? prevHash : "");
  h.update("|");
  h.update(data);
  return h.digest("hex");
}

// stable stringify: deterministic key order (shallow+deep)
export function stableStringify(value: any): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

export function computeEventHash(event: {
  reportId: string;
  type: string;
  actorRole: string;
  data: Record<string, unknown>;
  dataCiphertext?: string | null;
  createdAtISO: string;
}, prevHash: string | null): string {
  const payload = stableStringify(event);
  return hmacHex(payload, prevHash);
}