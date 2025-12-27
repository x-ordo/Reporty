/**
 * Minimal PII guard for metadata fields.
 *
 * Goal: prevent accidental leakage of identifiers into plaintext metadata (e.g., report_events.data).
 * This is NOT perfect PII detection. It is a pragmatic tripwire against common leaks:
 * - phone numbers, emails, national IDs
 * - "Name + honorific" patterns (Korean) often used in ops notes
 *
 * If it blocks a legitimate value, store that narrative into the encrypted payload instead.
 */
export function assertNoPiiInObject(obj: unknown, ctx: string): void {
  const issues: string[] = [];
  walk(obj, (s, path) => {
    const hit = detectPii(s);
    if (hit) issues.push(`${path}: ${hit}`);
  });

  if (issues.length > 0) {
    const msg = `metadata_pii_detected in ${ctx}: ` + issues.slice(0, 5).join("; ");
    throw new Error(msg);
  }
}

function walk(value: unknown, onString: (s: string, path: string) => void, path: string = "$"): void {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    onString(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, onString, `${path}[${i}]`));
    return;
  }
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    for (const k of Object.keys(rec)) {
      walk(rec[k], onString, `${path}.${k}`);
    }
  }
}

function detectPii(s: string): string | null {
  const str = (s ?? "").trim();
  if (!str) return null;

  // email
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(str)) return "email";

  // Korean phone numbers (010/011/etc) or +82; allow short digit sequences by requiring length-ish
  if (/(\+82\s?)?0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}/.test(str)) return "phone";

  // Resident registration number style (######-#######)
  if (/\b\d{6}[-\s]?\d{7}\b/.test(str)) return "rrn";

  // Bank account-ish: long digit strings w/ separators (very rough)
  if (/\b\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4,8}\b/.test(str) && str.replace(/\D/g, "").length >= 10) return "digits";

  // Korean name + honorific / title patterns (common leak in ops notes)
  if (/([가-힣]{2,4})\s*(씨|님|대리|과장|부장|팀장|대표|사원|선임|주임)\b/.test(str)) return "name+title";

  // Western "First Last" name-ish
  if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(str)) return "name";

  return null;
}
