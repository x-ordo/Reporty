# SafeReport (Iron Dome) — Phase 1 Skeleton (P0)

This repo is a **Phase 1 (Week 1–4)** starter for:
- Anonymous report intake (public)
- Admin dashboard APIs (stub auth)
- Defense Log events + Access Audit
- Evidence Chain (HMAC chaining)
- PDF generation enqueue pipeline (R2 htmlKey → QStash → Lambda)

## 0) Quick start

```bash
npm i
cp .env.example .env.local
npm run dev
```

Open: http://localhost:3000

## 1) Database (Neon + Drizzle)

1) Create a Neon Postgres and copy `DATABASE_URL` into `.env.local`.
2) Generate migrations from `drizzle/schema.ts` and apply:

```bash
npm run db:generate
npm run db:migrate
```

Or, one-shot (generate + migrate + seed):

```bash
npm run db:setup
```

> Drizzle migrations are generated locally (no repo-committed SQL required).


## 2) Minimal auth (dev only)


## Partner Dashboard (Phase 1)

- `/partner` shows all tenants under the partner key.
- Traffic-light is computed from open reports using tenant SLA policy.
- Partner can edit per-tenant `tags` + `partnerNotes` from the dashboard (saved to DB).
- API:
  - `GET /api/partner/tenants`
  - `PATCH /api/partner/tenants/:id`

## Admin: Tenant Ops

- `/admin/tenants` lets admin edit tenant metadata:
  - `tags`, `adminNotes`, `isPremium`, `slaPolicy`
- API:
  - `GET /api/admin/tenants`
  - `PATCH /api/admin/tenants/:id`

### SLA policy fields

Stored on `tenants.slaPolicy` as JSON (all optional):
- `receivedHours` (default 48)
- `openDays` (default 14)
- `receivedHoursStrict` (default 24)
- `openDaysStrict` (default 7)
- `strictHints` (default list; substring match against report category)

Admin endpoints require header:

- `x-admin-key: <ADMIN_API_KEY>`

Set `ADMIN_API_KEY` in env.

## 3) PDF pipeline (Phase 1)

- `POST /api/admin/reports/:id/pdf` will:
  1) snapshot & verify the evidence chain (HMAC-linked event hashes)
  2) create a `defense_packs` row (`status=queued`) with `packId` + signature
  3) upload the HTML pack to R2 (`htmlKey`)
  4) enqueue the PDF generation Lambda via QStash

- `GET /api/admin/reports/:id/packs` lists generated/queued packs for a report.

- Optional Lambda completion callback:
  - `POST /api/internal/pdf-callback`
  - Header: `x-pdf-callback-token: <PDF_CALLBACK_TOKEN>`
  - Body: `{ packId, reportId, tenantId, ok, pdfPath?, error? }`
  - Updates `defense_packs` to `generated/failed` and writes an `access_audit` record.

**Required env (Phase 1)**
- `QSTASH_TOKEN`
- `PDF_LAMBDA_FUNCTION_URL`
- `R2_*` credentials (see `.env.example`)

**Optional env**
- `PDF_CALLBACK_TOKEN` (to protect the callback endpoint)


## 4) Key material

Generate example keys:

```bash
npm run keys:gen
```

Copy outputs into `.env.local`:
- MASTER_KEY_B64 (32 bytes base64) for AES-256-GCM encryption at rest
- PUBLIC_CODE_SECRET for public code hashing
- EVIDENCE_HMAC_KEY for evidence chain HMAC

## 5) Endpoints

### Public
- `POST /api/public/reports`
- `GET  /api/public/reports/[code]`

### Admin
- `GET  /api/admin/reports`
- `GET  /api/admin/reports/[id]`
- `GET  /api/admin/reports/[id]/payload`
- `POST /api/admin/reports/[id]/events`
- `POST /api/admin/reports/[id]/pdf`

## 1.1) Seed (demo partner/tenant)

```bash
npm run db:seed
```

It prints `tenantId` to use for public intake.

## 5.1) Evidence verification

- `GET /api/admin/reports/[id]/verify` recomputes the HMAC chain and compares against DB head hash.

## 5.2) Defense Pack includes verification

- `/api/admin/reports/[id]/pdf` embeds the evidence verification snapshot (PASS/FAIL + hashes + mismatch details) and a system HMAC signature into the generated PDF (via HTML).

## 6) AWS Lambda worker

See `lambda/pdf-generator/` for the production-grade Puppeteer + @sparticuz/chromium worker.


## Partner (Labor Attorney) flow (Phase 1.5)

1) Admin creates a partner at `/admin/partners`
   - you get **Invite Code** (shareable) and **Partner Key** (one-time, secret)
2) Company onboarding:
   - open `/onboard` → input Invite Code + Company name → creates a tenant
   - it returns an employee intake link: `/r/<tenantId>`
3) Partner portal:
   - open `/partner` → paste Partner Key → see tenant traffic lights (green/yellow/red)

Traffic light rule (current):
- **Red**: any `received` report older than 24h, or any open report older than 7d
- **Yellow**: any open report
- **Green**: no open reports

## Security tripwires (MVP)

### Metadata PII guard (plaintext fields)
`report_events.data` is plaintext JSONB but intended to contain **only non-sensitive metadata** (the API stores `{}` by default).
Full event metadata is stored encrypted in `report_events.data_ciphertext` with `data_key_id`.
The admin event API runs a PII guard on incoming event `data` and returns decrypted `dataFull` only to admins.

### Key versioning (future rotation)
Reports store `encryption_key_id`. Current default is `MASTER_KEY_ID` (default `v1`).  
Optional `KEYRING_JSON` can map ids to base64 keys, enabling future rotation without re-encrypting everything at once.

