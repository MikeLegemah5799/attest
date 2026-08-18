/**
 * Domain types shared across lib/pipeline/, lib/dates/, lib/db/, and the UI.
 * Defined once here per code-standards.md ("shared between lib/pipeline/,
 * lib/dates/, and the UI, not re-declared per file").
 */

/**
 * The confidence/verification state shown throughout the review UI.
 * Canonical source of truth for this vocabulary — components import it
 * from here rather than redeclaring it.
 */
export type ConfidenceStatus = "grounded" | "review" | "blocked" | "neutral";

/** The six field groups extraction targets, per project-overview.md. */
export type FieldGroup =
  | "parties_premises"
  | "term"
  | "rent_escalation"
  | "options_notice"
  | "expenses"
  | "risk_clauses";

/** A rectangle in PDF page coordinates, used for source-span highlighting. */
export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * A single extracted field, verified and persisted. Immutable — re-running
 * extraction produces a new row (new `runId`), never an update in place.
 */
export type ExtractionField = {
  id: string;
  documentId: string;
  runId: string;
  promptVersion: string;
  fieldGroup: FieldGroup;
  fieldKey: string;
  label: string;
  value: string;
  evidenceText: string;
  pageNumber: number;
  boundingBox: BoundingBox | null;
  confidence: number;
  status: ConfidenceStatus;
  createdAt: Date;
};

/** Whether a derived date was computed or blocked on an unverified input. */
export type DerivedDateStatus = "computed" | "blocked";

/**
 * A critical date derived from verified extraction fields — never a raw
 * model guess (architecture.md invariant 2).
 */
export type DerivedDate = {
  id: string;
  documentId: string;
  runId: string;
  dateType: string;
  label: string;
  value: string | null;
  status: DerivedDateStatus;
  reason: string | null;
  sourceFieldKeys: string[];
  createdAt: Date;
};

/**
 * A presence/absence risk fact (e.g. early termination, co-tenancy),
 * individually cited — not a composite score (see progress-tracker.md
 * Architecture Decisions).
 */
export type RiskFlag = {
  id: string;
  documentId: string;
  runId: string;
  flagType: string;
  label: string;
  present: boolean;
  status: ConfidenceStatus;
  evidenceText: string | null;
  pageNumber: number | null;
  sourceFieldKey: string | null;
  createdAt: Date;
};

/** Field-level accuracy for one eval run, scored against the gold set. */
export type FieldAccuracyScorecard = {
  totalFields: number;
  correctFields: number;
  accuracy: number;
  byFieldGroup: Partial<Record<FieldGroup, { total: number; correct: number }>>;
};

/** Derived-date accuracy, scored separately from field accuracy. */
export type DateAccuracyScorecard = {
  totalDates: number;
  correctDates: number;
  accuracy: number;
};

/** One `npm run eval` invocation — append-only, never edited after the fact. */
export type EvalRun = {
  id: string;
  runId: string;
  promptVersion: string;
  startedAt: Date;
  finishedAt: Date | null;
  fieldAccuracy: FieldAccuracyScorecard | null;
  dateAccuracy: DateAccuracyScorecard | null;
};
