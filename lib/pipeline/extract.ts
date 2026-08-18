import type { RawExtractedField } from "./types";

export type ExtractInput = {
  documentId: string;
  runId: string;
  promptVersion: string;
};

export type ExtractResult = {
  documentId: string;
  runId: string;
  promptVersion: string;
  fields: RawExtractedField[];
};

/**
 * Stage 2/6. Two-pass Claude extraction: a routing pass maps pages to field
 * groups, a targeted pass extracts each group against only its relevant
 * pages. Every Claude response is parsed and validated (zod) before being
 * treated as structured data (code-standards.md) — a malformed response
 * fails loudly rather than silently producing a bad extraction.
 */
export async function extract(_input: ExtractInput): Promise<ExtractResult> {
  throw new Error("not implemented");
}
