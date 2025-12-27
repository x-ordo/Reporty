import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";
import { Buffer } from "node:buffer";

export const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

export async function putText(key: string, text: string, contentType = "text/html; charset=utf-8") {
  await r2.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: Buffer.from(text, "utf-8"),
    ContentType: contentType
  }));
}

export async function getObjectStream(key: string) {
  return r2.send(new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key
  }));
}