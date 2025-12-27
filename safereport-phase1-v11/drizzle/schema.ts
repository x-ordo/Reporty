import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const partners = pgTable("partners", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),

  // partner portal key (store hash only)
  apiKeyHash: varchar("api_key_hash", { length: 64 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 10 }).notNull(),

  revenueShareRate: numeric("revenue_share_rate", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  partnerId: uuid("partner_id").references(() => partners.id),
  name: varchar("name", { length: 120 }).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),

  // lightweight tenant metadata for partner ops
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  adminNotes: text("admin_notes"),
  partnerNotes: text("partner_notes"),

  // SLA thresholds used for partner dashboard traffic-light.
  // Defaults are applied in code if omitted.
  slaPolicy: jsonb("sla_policy")
    .$type<{
      receivedHours?: number;
      openDays?: number;
      receivedHoursStrict?: number;
      openDaysStrict?: number;
      strictHints?: string[];
    }>()
    .default({})
    .notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  partnerIdx: index("tenants_partner_idx").on(t.partnerId)
}));

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 30 }).notNull().default("admin"), // admin, investigator, viewer
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  tenantEmailUniq: uniqueIndex("users_tenant_email_uniq").on(t.tenantId, t.email)
}));

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  // Store hash only; the plain code is returned only once on creation.
  publicCodeHash: varchar("public_code_hash", { length: 64 }).notNull(), // sha256 hex
  status: varchar("status", { length: 30 }).notNull().default("received"),
  subject: varchar("subject", { length: 200 }),
  category: varchar("category", { length: 60 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
  // future: KMS id
  encryptionKeyId: varchar("encryption_key_id", { length: 120 })
}, (t) => ({
  tenantStatusIdx: index("reports_tenant_status_idx").on(t.tenantId, t.status),
  codeIdx: uniqueIndex("reports_public_code_hash_uniq").on(t.publicCodeHash)
}));

export const reportPayloads = pgTable("report_payloads", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id).notNull(),
  ciphertext: text("ciphertext").notNull(),
  // R2 keys + metadata only (no raw attachments in DB)
  attachments: jsonb("attachments").$type<Array<{ key: string; name: string; size?: number; mime?: string }>>().default([]).notNull(),
  piiRedactionLevel: integer("pii_redaction_level").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  reportUniq: uniqueIndex("report_payloads_report_uniq").on(t.reportId)
}));

export const reportEvents = pgTable("report_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id).notNull(),
  type: varchar("type", { length: 60 }).notNull(), // received, investigation_started, protective_action, ...
  actorRole: varchar("actor_role", { length: 30 }).notNull(), // admin, partner, system
  data: jsonb("data").$type<Record<string, unknown>>().default({}).notNull(),
  // Encrypted full event metadata (keep JSONB data non-sensitive)
  dataCiphertext: text("data_ciphertext"),
  dataKeyId: varchar("data_key_id", { length: 120 }),
  prevEventHash: varchar("prev_event_hash", { length: 64 }),
  eventHash: varchar("event_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  reportCreatedIdx: index("report_events_report_created_idx").on(t.reportId, t.createdAt)
}));

export const accessAudit = pgTable("access_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id).notNull(),
  actorId: uuid("actor_id"), // nullable for system
  actorRole: varchar("actor_role", { length: 30 }).notNull(),
  action: varchar("action", { length: 30 }).notNull(), // view, download, pdf, share
  reasonCode: varchar("reason_code", { length: 60 }).notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  reportCreatedIdx: index("access_audit_report_created_idx").on(t.reportId, t.createdAt)
}));

export const evidenceChain = pgTable("evidence_chain", {
  reportId: uuid("report_id").references(() => reports.id).primaryKey(),
  headHash: varchar("head_hash", { length: 64 }).notNull(),
  algo: varchar("algo", { length: 30 }).notNull().default("HMAC-SHA256"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const defensePacks = pgTable("defense_packs", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("queued"), // queued, generated, failed
  reasonCode: varchar("reason_code", { length: 60 }).notNull(),
  htmlKey: text("html_key").notNull(),
  pdfPath: text("pdf_path"), // storage path after Lambda upload
  verifyOk: boolean("verify_ok").notNull().default(false),
  storedHead: varchar("stored_head", { length: 64 }).notNull(),
  computedHead: varchar("computed_head", { length: 64 }),
  eventsCount: integer("events_count").notNull().default(0),
  mismatch: jsonb("mismatch").$type<Record<string, unknown> | null>(),
  snapshotPayload: jsonb("snapshot_payload").$type<Record<string, unknown>>().default({}).notNull(),
  signature: varchar("signature", { length: 64 }).notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  reportCreatedIdx: index("defense_packs_report_created_idx").on(t.reportId, t.createdAt),
  tenantCreatedIdx: index("defense_packs_tenant_created_idx").on(t.tenantId, t.createdAt)
}));
