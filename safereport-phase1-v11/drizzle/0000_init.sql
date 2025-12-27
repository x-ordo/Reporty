-- SafeReport Phase 1 init (v2.0.1)
-- Note: run via `drizzle-kit migrate` (dialect: postgresql)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  invite_code varchar(20) UNIQUE,
  revenue_share_rate numeric(5,2) DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id),
  name varchar(120) NOT NULL,
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenants_partner_idx ON tenants(partner_id);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email varchar(255) NOT NULL,
  role varchar(30) NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_tenant_email_uniq UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  public_code_hash varchar(64) NOT NULL UNIQUE,
  status varchar(30) NOT NULL DEFAULT 'received',
  subject varchar(200),
  category varchar(60),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz,
  encryption_key_id varchar(120)
);
CREATE INDEX IF NOT EXISTS reports_tenant_status_idx ON reports(tenant_id, status);

CREATE TABLE IF NOT EXISTS report_payloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) UNIQUE,
  ciphertext text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  pii_redaction_level int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id),
  type varchar(60) NOT NULL,
  actor_role varchar(30) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_event_hash varchar(64),
  event_hash varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_events_report_created_idx ON report_events(report_id, created_at);

CREATE TABLE IF NOT EXISTS access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id),
  actor_id uuid,
  actor_role varchar(30) NOT NULL,
  action varchar(30) NOT NULL,
  reason_code varchar(60) NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS access_audit_report_created_idx ON access_audit(report_id, created_at);

CREATE TABLE IF NOT EXISTS evidence_chain (
  report_id uuid PRIMARY KEY REFERENCES reports(id),
  head_hash varchar(64) NOT NULL,
  algo varchar(30) NOT NULL DEFAULT 'HMAC-SHA256',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
