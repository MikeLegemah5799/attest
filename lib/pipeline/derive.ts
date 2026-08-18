import { updateDocumentStatus } from "@/lib/db/queries/documents";
import { insertDerivedDates } from "@/lib/db/queries/derivedDates";
import { listExtractionsForRun } from "@/lib/db/queries/extractions";
import { insertRiskFlags } from "@/lib/db/queries/riskFlags";
import { deriveCriticalDates, deriveRiskFlags } from "@/lib/dates";
import type { DerivedDate, RiskFlag } from "@/lib/types";

export type DeriveInput = {
  documentId: string;
  runId: string;
};

export type DeriveResult = {
  dates: DerivedDate[];
  riskFlags: RiskFlag[];
};

/**
 * Stage 5/6. Loads this run's persisted extraction rows via lib/db, runs
 * them through the pure lib/dates/ engine, and persists the resulting
 * critical dates and risk flags. lib/dates/ itself never touches I/O or
 * the LLM (invariant 3) — this stage is the I/O boundary around it.
 */
export async function derive(input: DeriveInput): Promise<DeriveResult> {
  const extractions = listExtractionsForRun(input.documentId, input.runId);

  const pendingDates = deriveCriticalDates({
    documentId: input.documentId,
    runId: input.runId,
    extractions,
  });
  const pendingFlags = deriveRiskFlags({
    documentId: input.documentId,
    runId: input.runId,
    extractions,
  });

  const dates = insertDerivedDates(pendingDates);
  const riskFlags = insertRiskFlags(pendingFlags);
  updateDocumentStatus(input.documentId, "derived");

  return { dates, riskFlags };
}
