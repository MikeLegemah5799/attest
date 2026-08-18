import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

/**
 * Document metadata. One row per seeded lease PDF (fixtures/, not uploaded
 * at runtime — see project-overview.md Scope).
 */
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  filename: text("filename").notNull(),
  title: text("title").notNull(),
  pageCount: integer("page_count"),
  status: text("status", {
    enum: ["pending", "ingested", "extracted", "verified", "derived", "failed"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Page text index. The page text itself is cached to disk per document
 * (code-standards.md — "not persisted as a giant text column"); this row
 * points at that cache and records enough to verify it's populated.
 */
export const pages = sqliteTable(
  "pages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    pageNumber: integer("page_number").notNull(),
    charCount: integer("char_count").notNull(),
    textCachePath: text("text_cache_path").notNull(),
  },
  (table) => [unique().on(table.documentId, table.pageNumber)],
);

/**
 * Extracted fields. Immutable and versioned by (runId, promptVersion) —
 * invariant 4 in architecture.md. Never update a row in place; re-running
 * extraction writes new rows so any two runs can be diffed field by field.
 */
export const extractions = sqliteTable("extractions", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  runId: text("run_id").notNull(),
  promptVersion: text("prompt_version").notNull(),
  fieldGroup: text("field_group", {
    enum: [
      "parties_premises",
      "term",
      "rent_escalation",
      "options_notice",
      "expenses",
      "risk_clauses",
    ],
  }).notNull(),
  fieldKey: text("field_key").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  evidenceText: text("evidence_text").notNull(),
  pageNumber: integer("page_number").notNull(),
  // JSON-encoded BoundingBox ({ x, y, width, height }), null until computed
  // from the grounding match against the pdf.js text-item index.
  boundingBox: text("bounding_box"),
  confidence: real("confidence").notNull(),
  // Grounding check result — string-matched against the source page before
  // persisting (invariant 1). Ungrounded values must not reach this table.
  groundingStatus: text("grounding_status", { enum: ["grounded", "ungrounded"] }).notNull(),
  // Verifier pass result — a second model call judging whether the cited
  // evidence supports the value. Null until the verify stage runs.
  verifierStatus: text("verifier_status", { enum: ["confirmed", "rejected"] }),
  status: text("status", { enum: ["grounded", "review", "blocked", "neutral"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Derived critical dates. Computed deterministically from verified
 * extraction rows by lib/dates/ — never a raw model guess (invariant 2).
 */
export const derivedDates = sqliteTable("derived_dates", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  runId: text("run_id").notNull(),
  dateType: text("date_type").notNull(),
  label: text("label").notNull(),
  value: text("value"),
  status: text("status", { enum: ["computed", "blocked"] }).notNull(),
  reason: text("reason"),
  // JSON-encoded string[] of the extraction fieldKeys this date was derived
  // from, so a derived date can always be traced back to its source fields.
  sourceFieldKeys: text("source_field_keys").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Risk flags — presence/absence facts, each individually cited rather than
 * rolled into a composite score (see progress-tracker.md Architecture
 * Decisions).
 */
export const riskFlags = sqliteTable("risk_flags", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id),
  runId: text("run_id").notNull(),
  flagType: text("flag_type").notNull(),
  label: text("label").notNull(),
  present: integer("present", { mode: "boolean" }).notNull(),
  status: text("status", { enum: ["grounded", "review", "blocked", "neutral"] }).notNull(),
  evidenceText: text("evidence_text"),
  pageNumber: integer("page_number"),
  // The extraction fieldKey this flag was derived from — a field key, like
  // derivedDates.sourceFieldKeys, not a row id, so it reads the same way
  // across both derived tables.
  sourceFieldKey: text("source_field_key"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Hand-labeled gold values for the eval harness, seeded from the protected
 * fixtures/gold/* source files (ai-workflow-rules.md) — this table is a
 * queryable mirror of those files, not an independent source of truth.
 */
export const goldLabels = sqliteTable(
  "gold_labels",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    fieldKey: text("field_key").notNull(),
    expectedValue: text("expected_value").notNull(),
    notes: text("notes"),
  },
  (table) => [unique().on(table.documentId, table.fieldKey)],
);

/**
 * One row per `npm run eval` invocation. Append-only (ai-workflow-rules.md
 * — historical eval output is never edited or deleted), so two runs with
 * different promptVersions can be diffed later.
 */
export const evalRuns = sqliteTable("eval_runs", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  promptVersion: text("prompt_version").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  // JSON-encoded scorecards — shape defined in evals/types.ts.
  fieldAccuracy: text("field_accuracy"),
  dateAccuracy: text("date_accuracy"),
});
