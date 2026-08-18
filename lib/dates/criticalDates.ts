import type { DerivedDate, ExtractionField } from "@/lib/types";

export type DeriveCriticalDatesInput = {
  documentId: string;
  runId: string;
  extractions: ExtractionField[];
};

/** The four `dateType` values this module ever produces — the single source
 * of truth other modules (surfacePrep's timeline ordering, evals' gold-label
 * routing) key off, instead of re-declaring the same four strings. */
export const CRITICAL_DATE_TYPES = [
  "commencement",
  "expiration",
  "renewal_notice_deadline",
  "next_escalation",
] as const;

type PendingDate = Omit<DerivedDate, "id" | "createdAt">;

function groundedField(
  byFieldKey: Map<string, ExtractionField>,
  fieldKey: string,
): ExtractionField | null {
  const field = byFieldKey.get(fieldKey);
  return field && field.status === "grounded" ? field : null;
}

/** ISO date string (YYYY-MM-DD), or null if `value` isn't a parseable date. */
function parseDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addYears(isoDate: string, years: number): string {
  const date = new Date(isoDate);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}

/** Days implied by free text like "180 days", "(180) days", or "six (6) months". */
function parseNoticePeriodDays(value: string): number | null {
  const match = value.match(/\((\d+)\)\s*(day|month|year)s?/i) ?? value.match(/(\d+)\s*(day|month|year)s?/i);
  if (!match) return null;
  const amount = Number.parseInt(match[1], 10);
  switch (match[2].toLowerCase()) {
    case "day":
      return amount;
    case "month":
      return amount * 30;
    case "year":
      return amount * 365;
    default:
      return null;
  }
}

function computed(base: Pick<PendingDate, "documentId" | "runId" | "dateType" | "label" | "sourceFieldKeys">, value: string): PendingDate {
  return { ...base, value, status: "computed", reason: null };
}

function blocked(base: Pick<PendingDate, "documentId" | "runId" | "dateType" | "label" | "sourceFieldKeys">, reason: string): PendingDate {
  return { ...base, value: null, status: "blocked", reason };
}

/** A directly-extracted date field, passed through with confidence gating (no computation). */
function derivePassThroughDate(
  byFieldKey: Map<string, ExtractionField>,
  base: {
    documentId: string;
    runId: string;
    dateType: string;
    label: string;
    fieldKey: string;
  },
): { pending: PendingDate; parsedValue: string | null } {
  const meta = { ...base, sourceFieldKeys: [base.fieldKey] };
  const field = groundedField(byFieldKey, base.fieldKey);
  if (!field) {
    return { pending: blocked(meta, `${base.fieldKey} field not extracted or not grounded`), parsedValue: null };
  }
  const parsed = parseDate(field.value);
  if (!parsed) {
    return { pending: blocked(meta, `could not parse a date from ${base.fieldKey}'s extracted value`), parsedValue: null };
  }
  return { pending: computed(meta, parsed), parsedValue: parsed };
}

function deriveRenewalNoticeDeadline(
  byFieldKey: Map<string, ExtractionField>,
  documentId: string,
  runId: string,
  expirationDate: string | null,
): PendingDate {
  const meta = {
    documentId,
    runId,
    dateType: "renewal_notice_deadline",
    label: "Renewal Notice Deadline",
    sourceFieldKeys: ["expiration_date", "renewal_notice_deadline"],
  };
  if (!expirationDate) {
    return blocked(meta, "expiration_date must be resolved before a renewal notice deadline can be computed");
  }
  const noticeField = groundedField(byFieldKey, "renewal_notice_deadline");
  if (!noticeField) {
    return blocked(meta, "renewal_notice_deadline field not extracted or not grounded");
  }
  const days = parseNoticePeriodDays(noticeField.value);
  if (days === null) {
    return blocked(meta, `could not parse a notice period from "${noticeField.value}"`);
  }
  return computed(meta, addDays(expirationDate, -days));
}

/**
 * Only computes a specific date for a recognized annual cadence — escalation
 * schedules are free text in a wide variety of formats, and guessing a date
 * from an unrecognized one would violate invariant 2. Unrecognized formats
 * block with a reason rather than a best-effort guess.
 */
function deriveNextEscalationDate(
  byFieldKey: Map<string, ExtractionField>,
  documentId: string,
  runId: string,
  commencementDate: string | null,
): PendingDate {
  const meta = {
    documentId,
    runId,
    dateType: "next_escalation",
    label: "Next Escalation Date",
    sourceFieldKeys: ["commencement_date", "escalation_type", "escalation_schedule"],
  };
  if (!commencementDate) {
    return blocked(meta, "commencement_date must be resolved before an escalation date can be computed");
  }
  const typeField = groundedField(byFieldKey, "escalation_type");
  const scheduleField = groundedField(byFieldKey, "escalation_schedule");
  if (!typeField && !scheduleField) {
    return blocked(meta, "escalation_type and escalation_schedule fields not extracted or not grounded");
  }
  const text = `${typeField?.value ?? ""} ${scheduleField?.value ?? ""}`;
  if (!/annual/i.test(text)) {
    return blocked(meta, "escalation cadence not recognized as annual — cannot compute a specific date");
  }
  return computed(meta, addYears(commencementDate, 1));
}

/**
 * Computes critical dates (notice windows, renewal deadlines, expiration,
 * escalation dates) deterministically from verified extraction fields.
 *
 * Pure — no I/O, no LLM calls (architecture.md invariant 3). If an input
 * field the calculation depends on falls below the confidence threshold,
 * this must emit a `blocked` result with a reason rather than a
 * best-effort date (invariant 2) — never silently skip or guess.
 */
export function deriveCriticalDates(input: DeriveCriticalDatesInput): PendingDate[] {
  const byFieldKey = new Map(input.extractions.map((field) => [field.fieldKey, field]));
  const { documentId, runId } = input;

  const commencement = derivePassThroughDate(byFieldKey, {
    documentId,
    runId,
    dateType: "commencement",
    label: "Commencement Date",
    fieldKey: "commencement_date",
  });
  const expiration = derivePassThroughDate(byFieldKey, {
    documentId,
    runId,
    dateType: "expiration",
    label: "Expiration Date",
    fieldKey: "expiration_date",
  });

  return [
    commencement.pending,
    expiration.pending,
    deriveRenewalNoticeDeadline(byFieldKey, documentId, runId, expiration.parsedValue),
    deriveNextEscalationDate(byFieldKey, documentId, runId, commencement.parsedValue),
  ];
}
