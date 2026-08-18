import type { ExtractionField, RiskFlag } from "@/lib/types";

export type DeriveRiskFlagsInput = {
  documentId: string;
  runId: string;
  extractions: ExtractionField[];
};

type PendingRiskFlag = Omit<RiskFlag, "id" | "createdAt">;

type RiskFlagSpec = {
  flagType: string;
  label: string;
  sourceFieldKey: string;
};

/**
 * One risk flag per risk_clauses field (lib/pipeline/fields.ts) — chosen
 * 1:1 in project-overview.md's Field List specifically so each flag traces
 * to an unambiguous source field.
 */
const RISK_FLAG_SPECS: RiskFlagSpec[] = [
  {
    flagType: "early_termination",
    label: "Early Termination Right",
    sourceFieldKey: "early_termination_right",
  },
  {
    flagType: "co_tenancy",
    label: "Co-Tenancy Clause",
    sourceFieldKey: "co_tenancy_clause",
  },
  {
    flagType: "assignment_consent",
    label: "Assignment/Subletting Consent Required",
    sourceFieldKey: "assignment_subletting_consent",
  },
  {
    flagType: "percentage_rent",
    label: "Percentage Rent Clause",
    sourceFieldKey: "percentage_rent_clause",
  },
];

/**
 * Computes risk flags (early termination, co-tenancy, assignment consent,
 * percentage rent, etc.) as presence/absence facts from verified extraction
 * fields, each traceable to a source field — not a composite score (see
 * progress-tracker.md Architecture Decisions).
 *
 * Pure — no I/O, no LLM calls (architecture.md invariant 3).
 *
 * A source field only ever grounds a *positive* claim ("this clause is
 * present, here's the quote") — verbatim evidence can't cite a clause's
 * absence. So a field that was never extracted, or that failed grounding
 * or verification, is `blocked` rather than treated as a confirmed
 * absence: extraction not finding something is not the same as the lease
 * genuinely not containing it.
 */
export function deriveRiskFlags(input: DeriveRiskFlagsInput): PendingRiskFlag[] {
  const byFieldKey = new Map(input.extractions.map((field) => [field.fieldKey, field]));

  return RISK_FLAG_SPECS.map((spec) => {
    const base = {
      documentId: input.documentId,
      runId: input.runId,
      flagType: spec.flagType,
      label: spec.label,
      sourceFieldKey: spec.sourceFieldKey,
    };
    const field = byFieldKey.get(spec.sourceFieldKey);

    if (!field || field.status === "blocked") {
      return { ...base, present: false, status: "blocked" as const, evidenceText: null, pageNumber: null };
    }

    return {
      ...base,
      present: true,
      status: field.status,
      evidenceText: field.evidenceText,
      pageNumber: field.pageNumber,
    };
  });
}
