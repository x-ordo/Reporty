import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { env } from "./env";
import { Buffer } from "node:buffer";

type Keyring = Record<string, string>;

function parseKeyring(): Keyring {
  const raw = env.KEYRING_JSON;
  if (!raw) return {};
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object") return j as Keyring;
    return {};
  } catch {
    return {};
  }
}

function getKeyById(keyId?: string | null): Buffer {
  const ring = parseKeyring();
  const id = (keyId ?? env.MASTER_KEY_ID ?? "v1").trim();
  const b64 = ring[id] ?? env.MASTER_KEY_B64;

  const buf = Buffer.from(b64, "base64");
  if (buf.length !== 32) throw new Error(`Key ${id} must decode to 32 bytes (AES-256)`);
  return buf;
}

export function currentKeyId(): string {
  return (env.MASTER_KEY_ID ?? "v1").trim();
}


/**
 * AES-256-GCM: returns base64(payload) where payload = iv(12) + tag(16) + ciphertext
 */
export function encryptJson(obj: unknown, keyId?: string | null): string {
  const key = getKeyById(keyId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf-8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptJson<T = unknown>(b64: string, keyId?: string | null): T {
  const raw = Buffer.from(b64, "base64");
  if (raw.length < 12 + 16 + 1) throw new Error("ciphertext_too_short");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = getKeyById(keyId);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
  return JSON.parse(plaintext) as T;
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function makePublicCodeHash(code: string): string {
  // hash = sha256(code + secret)
  return sha256Hex(code + ":" + env.PUBLIC_CODE_SECRET);
}

const SALT_ROUNDS = 12;

export async function makePartnerKeyHash(key: string): Promise<string> {
  return bcrypt.hash(key, SALT_ROUNDS);
}

export async function comparePartnerKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}