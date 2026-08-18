import type { ExtractionField, RiskFlag } from "@/lib/types";

export type DeriveRiskFlagsInput = {
  documentId: string;
  runId: string;
  extractions: ExtractionField[];
};

/**
 * Computes risk flags (early termination, co-tenancy, assignment consent,
 * percentage rent, etc.) as presence/absence facts from verified extraction
 * fields, each traceable to a source field — not a composite score (see
 * progress-tracker.md Architecture Decisions).
 *
 * Pure — no I/O, no LLM calls (architecture.md invariant 3).
 */
export function deriveRiskFlags(
  _input: DeriveRiskFlagsInput,
): Omit<RiskFlag, "id" | "createdAt">[] {
  throw new Error("not implemented");
}
