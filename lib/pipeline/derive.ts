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
export async function derive(_input: DeriveInput): Promise<DeriveResult> {
  throw new Error("not implemented");
}
