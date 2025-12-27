import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function optional(name, fallback = undefined) {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

function ensureArgs(args) {
  const set = new Set(args);
  // Safety: some environments require these flags explicitly
  if (!set.has("--no-sandbox")) args.push("--no-sandbox");
  if (!set.has("--disable-setuid-sandbox")) args.push("--disable-setuid-sandbox");
  // Better font rendering quality (esp. CJK)
  if (!set.has("--font-render-hinting=none")) args.push("--font-render-hinting=none");
  return args;
}

const s3 = new S3Client({
  region: "auto",
  endpoint: required("R2_ENDPOINT"),
  credentials: {
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY")
  },
  forcePathStyle: true
});

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function getTextFromR2(key) {
  const res = await s3.send(new GetObjectCommand({
    Bucket: required("R2_BUCKET_NAME"),
    Key: key
  }));
  const buf = await streamToBuffer(res.Body);
  return buf.toString("utf-8");
}

async function putPdfToR2(key, pdfBuffer) {
  await s3.send(new PutObjectCommand({
    Bucket: required("R2_BUCKET_NAME"),
    Key: key,
    Body: pdfBuffer,
    ContentType: "application/pdf"
  }));
}

function parseEventBody(event) {
  // Lambda Function URL / API Gateway
  if (event && typeof event === "object") {
    if (typeof event.body === "string" && event.body.length) {
      return JSON.parse(event.body);
    }
    // direct invoke
    return event;
  }
  throw new Error("Invalid event");
}

async function callback(payload) {
  const url = optional("APP_CALLBACK_URL");
  const token = optional("PDF_CALLBACK_TOKEN");
  if (!url || !token) return;

  await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pdf-callback-token": token
    },
    body: JSON.stringify(payload)
  }).catch(() => null);
}

export const handler = async (event) => {
  let browser = null;
  const startedAt = Date.now();

  try {
    const body = parseEventBody(event);

    const {
      tenantId,
      reportId,
      htmlKey,
      packId,
      signature
    } = body ?? {};

    if (!tenantId || !reportId || !htmlKey || !packId || !signature) {
      throw new Error("Missing required body fields: tenantId, reportId, htmlKey, packId, signature");
    }

    // Preload a Korean font to avoid tofu (ㅁㅁㅁ).
// In AWS Lambda Linux runtime, Korean fonts are not installed by default.
// If this is missing, PDFs can be unreadable => FAIL fast.
const fontUrl = process.env.FONT_URL;
if (!fontUrl) {
  throw new Error("CRITICAL: FONT_URL env var is missing. PDF would be broken (tofu).");
}
await chromium.font(fontUrl);


    const html = await getTextFromR2(htmlKey);

    browser = await puppeteer.launch({
      args: ensureArgs([...chromium.args]),
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "22mm", left: "15mm", right: "15mm" }
    });

    const pdfKey = `packs/${tenantId}/${reportId}/${packId}.pdf`;
    await putPdfToR2(pdfKey, pdfBuffer);

    await callback({
      packId,
      reportId,
      tenantId,
      signature,
      ok: true,
      pdfPath: pdfKey
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        pdfPath: pdfKey,
        ms: Date.now() - startedAt
      })
    };
  } catch (err) {
    const msg = String(err?.message ?? err);
    // try best-effort callback
    try {
      const body = parseEventBody(event);
      const { packId, reportId, tenantId, signature } = body ?? {};
      if (packId && reportId && tenantId && signature) {
        await callback({
          packId,
          reportId,
          tenantId,
          signature,
          ok: false,
          error: msg.slice(0, 500)
        });
      }
    } catch (_) {}

    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: msg.slice(0, 500) })
    };
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
};
