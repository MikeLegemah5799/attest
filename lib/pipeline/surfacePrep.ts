import { listLatestDerivedDates } from "@/lib/db/queries/derivedDates";
import { listLatestExtractions } from "@/lib/db/queries/extractions";
import { listLatestRiskFlags } from "@/lib/db/queries/riskFlags";
import type { DerivedDate, ExtractionField, FieldGroup, RiskFlag } from "@/lib/types";

import { FIELD_GROUPS, FIELD_SPECS, fieldSpecsForGroup } from "./fields";

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

// UI-facing display order — timeline/chronological for dates, spec
// declaration order for risk flags. Neither is guaranteed by DB row order,
// so it's fixed here rather than left to whatever SQLite happens to return.
const DATE_TYPE_ORDER = ["commencement", "expiration", "renewal_notice_deadline", "next_escalation"];
const FLAG_TYPE_ORDER = ["early_termination", "co_tenancy", "assignment_consent", "percentage_rent"];

function byCanonicalOrder<T>(order: string[], keyOf: (item: T) => string) {
  return (a: T, b: T) => order.indexOf(keyOf(a)) - order.indexOf(keyOf(b));
}

/**
 * Stage 6/6. Loads the latest run's persisted extractions, derived dates,
 * and risk flags via lib/db and shapes them for the review UI — grouped by
 * field group, tracker counts, the below-threshold review queue, and the
 * critical-date/risk-flag views. This is what will replace the hardcoded
 * arrays in app/lib/documents.ts and app/documents/_lib/review-data.ts;
 * app/ itself still owns final view formatting (labels, positions),
 * not derivation.
 */
export async function surfacePrep(input: SurfacePrepInput): Promise<SurfacePrepResult> {
  const extractions = listLatestExtractions(input.documentId);
  const byFieldOrder = byCanonicalOrder(
    FIELD_SPECS.map((s) => s.fieldKey),
    (f: ExtractionField) => f.fieldKey,
  );

  const fieldSections = FIELD_GROUPS.map((fieldGroup) => ({
    fieldGroup,
    fields: extractions.filter((f) => f.fieldGroup === fieldGroup).sort(byFieldOrder),
  }));

  const trackerCategories = FIELD_GROUPS.map((fieldGroup) => ({
    fieldGroup,
    grounded: extractions.filter((f) => f.fieldGroup === fieldGroup && f.status === "grounded").length,
    total: fieldSpecsForGroup(fieldGroup).length,
  }));

  const queueItems = extractions
    .filter((f) => f.status === "review" || f.status === "blocked")
    .sort(byFieldOrder);

  const criticalDates = listLatestDerivedDates(input.documentId).sort(
    byCanonicalOrder(DATE_TYPE_ORDER, (d) => d.dateType),
  );
  const riskFlags = listLatestRiskFlags(input.documentId).sort(
    byCanonicalOrder(FLAG_TYPE_ORDER, (f) => f.flagType),
  );

  return {
    documentId: input.documentId,
    fieldSections,
    trackerCategories,
    queueItems,
    criticalDates,
    riskFlags,
  };
}
