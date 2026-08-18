import type { DerivedDate, ExtractionField } from "@/lib/types";

export type DeriveCriticalDatesInput = {
  documentId: string;
  runId: string;
  extractions: ExtractionField[];
};

/**
 * Computes critical dates (notice windows, renewal deadlines, expiration,
 * escalation dates) deterministically from verified extraction fields.
 *
 * Pure — no I/O, no LLM calls (architecture.md invariant 3). If an input
 * field the calculation depends on falls below the confidence threshold,
 * this must emit a `blocked` result with a reason rather than a
 * best-effort date (invariant 2) — never silently skip or guess.
 */
export function deriveCriticalDates(
  _input: DeriveCriticalDatesInput,
): Omit<DerivedDate, "id" | "createdAt">[] {
  throw new Error("not implemented");
}
