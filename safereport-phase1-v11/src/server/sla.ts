export type SlaPolicy = {
  receivedHours?: number;
  openDays?: number;
  receivedHoursStrict?: number;
  openDaysStrict?: number;
  strictHints?: string[];
};

export type ResolvedSla = Required<SlaPolicy>;

const DEFAULT_SLA: ResolvedSla = {
  receivedHours: 48,
  openDays: 14,
  receivedHoursStrict: 24,
  openDaysStrict: 7,
  strictHints: ["성", "성희롱", "폭행", "폭언", "협박", "스토킹", "강요"]
};

export function resolveSla(policy: SlaPolicy | null | undefined): ResolvedSla {
  return {
    receivedHours: policy?.receivedHours ?? DEFAULT_SLA.receivedHours,
    openDays: policy?.openDays ?? DEFAULT_SLA.openDays,
    receivedHoursStrict: policy?.receivedHoursStrict ?? DEFAULT_SLA.receivedHoursStrict,
    openDaysStrict: policy?.openDaysStrict ?? DEFAULT_SLA.openDaysStrict,
    strictHints: Array.isArray(policy?.strictHints) && policy!.strictHints!.length
      ? policy!.strictHints!
      : DEFAULT_SLA.strictHints
  };
}

export function isStrictCategory(category: string | null | undefined, strictHints: string[]): boolean {
  if (!category) return false;
  const c = category.trim();
  if (!c) return false;
  return strictHints.some(h => h && c.includes(h));
}

export function isUrgentReport(input: {
  status: string;
  createdAt: Date;
  category?: string | null;
  policy?: SlaPolicy | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  const sla = resolveSla(input.policy);
  const strict = isStrictCategory(input.category ?? null, sla.strictHints);
  const ageMs = now.getTime() - input.createdAt.getTime();

  const receivedLimitMs = (strict ? sla.receivedHoursStrict : sla.receivedHours) * 3600 * 1000;
  const openLimitMs = (strict ? sla.openDaysStrict : sla.openDays) * 24 * 3600 * 1000;

  if (input.status === "received") return ageMs > receivedLimitMs;
  if (input.status !== "closed") return ageMs > openLimitMs;
  return false;
}
