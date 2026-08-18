import { updateDocumentStatus } from "@/lib/db/queries/documents";
import { insertExtractions, type NewExtraction } from "@/lib/db/queries/extractions";
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
export async function persist(input: PersistInput): Promise<ExtractionField[]> {
  const rows: NewExtraction[] = input.fields.map((field) => ({
    documentId: input.documentId,
    runId: input.runId,
    promptVersion: input.promptVersion,
    fieldGroup: field.fieldGroup,
    fieldKey: field.fieldKey,
    label: field.label,
    value: field.value,
    evidenceText: field.evidenceText,
    pageNumber: field.pageNumber,
    boundingBox: field.boundingBox,
    confidence: field.confidence,
    groundingStatus: field.groundingStatus,
    verifierStatus: field.verifierStatus,
    status: field.status,
  }));

  const persisted = insertExtractions(rows);
  updateDocumentStatus(input.documentId, "verified");
  return persisted;
}
