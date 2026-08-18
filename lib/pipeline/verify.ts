import type { RawExtractedField, VerifiedField } from "./types";

export type VerifyInput = {
  documentId: string;
  fields: RawExtractedField[];
};

/**
 * Stage 3/6. For each extracted field: string-matches its evidence text
 * against the source page (the grounding check — invariant 1) via
 * lib/pdf/findEvidenceRects, then runs a verifier model call judging
 * whether the cited evidence actually supports the value. Evidence that
 * doesn't match the page is rejected before it ever reaches persist.
 */
export async function verify(_input: VerifyInput): Promise<VerifiedField[]> {
  throw new Error("not implemented");
}
