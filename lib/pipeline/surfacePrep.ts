import type { DerivedDate, ExtractionField, FieldGroup, RiskFlag } from "@/lib/types";

export type SurfacePrepInput = {
  documentId: string;
};

export type SurfacePrepResult = {
  documentId: string;
  fieldSections: { fieldGroup: FieldGroup; fields: ExtractionField[] }[];
  trackerCategories: { fieldGroup: FieldGroup; grounded: number; total: number }[];
  queueItems: ExtractionField[];
  criticalDates: DerivedDate[];
  riskFlags: RiskFlag[];
};

/**
 * Stage 6/6. Loads the latest run's persisted extractions, derived dates,
 * and risk flags via lib/db and shapes them for the review UI — grouped by
 * field group, tracker counts, the below-threshold review queue, and the
 * critical-date/risk-flag views. This is what will replace the hardcoded
 * arrays in app/lib/documents.ts and app/documents/_lib/review-data.ts;
 * app/ itself still owns final view formatting (labels, positions),
 * not derivation.
 */
export async function surfacePrep(_input: SurfacePrepInput): Promise<SurfacePrepResult> {
  throw new Error("not implemented");
}
