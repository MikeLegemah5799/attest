import type { ExtractionField } from "@/lib/types";
import type { VerifiedField } from "./types";

export type PersistInput = {
  documentId: string;
  runId: string;
  promptVersion: string;
  fields: VerifiedField[];
};

/**
 * Stage 4/6. Writes verified fields as new, immutable extraction rows via
 * lib/db/queries/extractions — never updates a prior run's rows in place
 * (invariant 4). The only stage besides derive that touches lib/db.
 */
export async function persist(_input: PersistInput): Promise<ExtractionField[]> {
  throw new Error("not implemented");
}
