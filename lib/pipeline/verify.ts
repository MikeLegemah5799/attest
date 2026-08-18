import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { findEvidenceRects, getPageText, loadPdf } from "@/lib/pdf";
import type { ConfidenceStatus } from "@/lib/types";

import { getAnthropicClient } from "./client";
import type { RawExtractedField, VerifiedField } from "./types";

export type VerifyInput = {
  documentId: string;
  filePath: string;
  fields: RawExtractedField[];
};

const MODEL = "claude-opus-5";
// Rough starting cutoff (progress-tracker.md Open Questions calls for
// exactly this — "start with a rough cutoff, recalibrate once the
// grounding/verifier/consistency signals are running against real
// fixtures") — resolved here now that verify actually produces those
// signals.
const CONFIDENCE_THRESHOLD = 0.7;

type GroundingResult = {
  field: RawExtractedField;
  groundingStatus: "grounded" | "ungrounded";
  boundingBox: VerifiedField["boundingBox"];
};

/** Grounding check (invariant 1) — pure string match, no LLM call. */
async function groundFields(
  filePath: string,
  fields: RawExtractedField[],
): Promise<GroundingResult[]> {
  const handle = await loadPdf(filePath);
  const pageCache = new Map<number, Awaited<ReturnType<typeof getPageText>>>();

  async function pageFor(pageNumber: number) {
    let page = pageCache.get(pageNumber);
    if (!page) {
      page = await getPageText(handle, pageNumber);
      pageCache.set(pageNumber, page);
    }
    return page;
  }

  const results: GroundingResult[] = [];
  for (const field of fields) {
    const page = await pageFor(field.pageNumber);
    const rects = findEvidenceRects(page.items, field.evidenceText);
    results.push({
      field,
      groundingStatus: rects.length > 0 ? "grounded" : "ungrounded",
      boundingBox: rects[0] ?? null,
    });
  }
  return results;
}

const VerdictSchema = z.enum(["confirmed", "rejected"]);

/** Batches every grounded field into one verifier call — a judge pass, not a re-extraction. */
async function runVerifier(
  grounded: GroundingResult[],
): Promise<Record<string, z.infer<typeof VerdictSchema>>> {
  if (grounded.length === 0) return {};

  const schema = z.object(
    Object.fromEntries(grounded.map((g) => [g.field.fieldKey, VerdictSchema])),
  );

  const claims = grounded
    .map(
      (g) =>
        `- ${g.field.fieldKey}: value="${g.field.value}", cited evidence="${g.field.evidenceText}"`,
    )
    .join("\n");

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: "high", format: zodOutputFormat(schema) },
    system:
      "You judge whether cited evidence actually supports an extracted value from a " +
      "commercial lease. The evidence text is confirmed to appear verbatim on the " +
      "source page — your job is only to judge whether it genuinely supports the " +
      'stated value, not to re-check the quote. Mark "rejected" if the evidence is ' +
      "irrelevant, contradicts the value, or is too ambiguous to support it.",
    messages: [{ role: "user", content: `Claims to judge:\n${claims}` }],
  });

  return schema.parse(response.parsed_output);
}

function statusFor(
  groundingStatus: "grounded" | "ungrounded",
  verifierStatus: "confirmed" | "rejected" | null,
  confidence: number,
): ConfidenceStatus {
  if (groundingStatus === "ungrounded") return "blocked";
  if (verifierStatus === "rejected") return "blocked";
  return confidence >= CONFIDENCE_THRESHOLD ? "grounded" : "review";
}

/**
 * Stage 3/6. For each extracted field: string-matches its evidence text
 * against the source page (the grounding check — invariant 1) via
 * lib/pdf/findEvidenceRects, then runs a verifier model call judging
 * whether the cited evidence actually supports the value. Evidence that
 * doesn't match the page is rejected before it ever reaches persist.
 */
export async function verify(input: VerifyInput): Promise<VerifiedField[]> {
  const groundingResults = await groundFields(input.filePath, input.fields);
  const grounded = groundingResults.filter((r) => r.groundingStatus === "grounded");
  const verdicts = await runVerifier(grounded);

  return groundingResults.map((result) => {
    const verifierStatus = verdicts[result.field.fieldKey] ?? null;
    return {
      ...result.field,
      boundingBox: result.boundingBox,
      groundingStatus: result.groundingStatus,
      verifierStatus,
      status: statusFor(result.groundingStatus, verifierStatus, result.field.confidence),
    };
  });
}
