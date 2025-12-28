import { z } from "zod";

export const EVENT_TYPES = [
  "investigation_started",
  "protective_action",
  "fact_finding",
  "action_decided",
  "action_executed",
  "prevention",
  "closed"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const ReportStatusSchema = z.enum(["received", "investigating", "in_progress", "closed"]);

const reason = z.string().min(2).max(60);

// NOTE: Route-level logic enforces required keys per type (see admin events API).
// Here we validate shape + sane bounds and allow forward-compatible extra fields.
const Base = z.object({
  reason,
  nextStatus: ReportStatusSchema.optional()
});

const InvestigationStarted = z.object({
  type: z.literal("investigation_started"),
  data: z.object({
    owner: z.string().min(2).max(120).optional(),
    startedAtISO: z.string().datetime().optional(),
    notes: z.string().max(2000).optional()
  }).strict().default({})
}).merge(Base);

const ProtectiveAction = z.object({
  type: z.literal("protective_action"),
  data: z.object({
    action: z.string().min(2).max(500).optional(),
    dueDateISO: z.string().datetime().optional(),
    responsible: z.string().max(120).optional(),
    notes: z.string().max(2000).optional()
  }).strict().default({})
}).merge(Base);

const FactFinding = z.object({
  type: z.literal("fact_finding"),
  data: z.object({
    interviewCount: z.number().int().min(0).max(999).optional(),
    evidenceSummary: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional()
  }).strict().default({})
}).merge(Base);

const ActionDecided = z.object({
  type: z.literal("action_decided"),
  data: z.object({
    decision: z.string().min(2).max(2000).optional(),
    decidedAtISO: z.string().datetime().optional(),
    notes: z.string().max(2000).optional()
  }).strict().default({})
}).merge(Base);

const ActionExecuted = z.object({
  type: z.literal("action_executed"),
  data: z.object({
    executionSummary: z.string().min(2).max(2000).optional(),
    executedAtISO: z.string().datetime().optional(),
    notes: z.string().max(2000).optional()
  }).strict().default({})
}).merge(Base);

const Prevention = z.object({
  type: z.literal("prevention"),
  data: z.object({
    measure: z.string().min(2).max(2000).optional(),
    trainingCompleted: z.boolean().optional(),
    notes: z.string().max(2000).optional()
  }).strict().default({})
}).merge(Base);

const Closed = z.object({
  type: z.literal("closed"),
  data: z.object({
    outcome: z.string().min(2).max(2000).optional(),
    closedAtISO: z.string().datetime().optional(),
    notes: z.string().max(2000).optional()
  }).strict().default({})
}).merge(Base);

export const EventCreateSchema = z.discriminatedUnion("type", [
  InvestigationStarted,
  ProtectiveAction,
  FactFinding,
  ActionDecided,
  ActionExecuted,
  Prevention,
  Closed
]);

export type EventCreateInput = z.infer<typeof EventCreateSchema>;

export function statusForEvent(type: EventType): z.infer<typeof ReportStatusSchema> | null {
  switch (type) {
    case "investigation_started":
      return "investigating";
    case "protective_action":
    case "fact_finding":
    case "action_decided":
    case "action_executed":
    case "prevention":
      return "in_progress";
    case "closed":
      return "closed";
    default:
      return null;
  }
}
