import crypto from "node:crypto";

function b64(n) {
  return crypto.randomBytes(n).toString("base64");
}

console.log("MASTER_KEY_B64=", b64(32));
console.log("PUBLIC_CODE_SECRET=", crypto.randomBytes(32).toString("hex"));
console.log("EVIDENCE_HMAC_KEY=", b64(32));
console.log("ADMIN_API_KEY=", crypto.randomBytes(24).toString("hex"));
