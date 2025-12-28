import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_API_KEY: z.string().min(1),
  MASTER_KEY_B64: z.string().min(1),
  // Key versioning (MVP): store a key id on reports; can later rotate keys.
  MASTER_KEY_ID: z.string().min(1).default("v1"),
  // Optional: JSON like {"v1":"<base64-32bytes>","v2":"<base64-32bytes>"}
  KEYRING_JSON: z.string().optional(),
  PUBLIC_CODE_SECRET: z.string().min(1),
  EVIDENCE_HMAC_KEY: z.string().min(1),
  R2_ENDPOINT: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  QSTASH_TOKEN: z.string().optional(),
  PDF_LAMBDA_FUNCTION_URL: z.string().optional(),
  PDF_CALLBACK_TOKEN: z.string().optional()
});

export const env = schema.parse(process.env);
