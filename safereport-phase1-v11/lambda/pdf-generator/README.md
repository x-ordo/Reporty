# SafeReport PDF Generator (AWS Lambda)

This Lambda receives a QStash POST body:

```json
{
  "tenantId": "uuid",
  "reportId": "uuid",
  "htmlKey": "packs/<tenant>/<report>/<pack>.html",
  "packId": "uuid",
  "signature": "hex-hmac"
}
```

It will:
1) download HTML from R2 (S3-compatible)
2) render with headless Chromium
3) upload PDF back to R2
4) call the app callback (optional) to mark `defense_packs` as generated/failed

## Env (Lambda)

Required:
- `R2_ENDPOINT`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Optional:
- `FONT_URL` (e.g. NotoSansKR .otf/.ttf to avoid Korean tofu)
- `APP_CALLBACK_URL` (e.g. `https://<your-app>/api/internal/pdf-callback`)
- `PDF_CALLBACK_TOKEN` (must match the app's `PDF_CALLBACK_TOKEN`)

## Deploy (simple zip)

Inside this folder:

```bash
npm i --omit=dev
zip -r pdf-generator.zip .
```

Upload to AWS Lambda (Node.js 20), set memory >= 1024MB (recommended 2048MB), timeout >= 30s,
and expose via Function URL. Put the Function URL into your app env as `PDF_LAMBDA_FUNCTION_URL`.

> Use `@sparticuz/chromium` (already included). Do NOT use `chrome-aws-lambda`.
