import { readFile } from "node:fs/promises";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { updateDocumentStatus } from "@/lib/db/queries/documents";
import { listPagesForDocument } from "@/lib/db/queries/pages";
import type { FieldGroup } from "@/lib/types";

import { getAnthropicClient } from "./client";
import { FIELD_GROUPS, fieldSpecsForGroup } from "./fields";
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

const MODEL = "claude-opus-5";
const ROUTING_PREVIEW_CHARS = 300;

type CachedPage = { pageNumber: number; text: string };

async function loadCachedPages(documentId: string): Promise<CachedPage[]> {
  const rows = listPagesForDocument(documentId);
  const pages = await Promise.all(
    rows.map(async (row) => ({
      pageNumber: row.pageNumber,
      text: await readFile(row.textCachePath, "utf-8"),
    })),
  );
  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

const RoutingSchema = z.object({
  parties_premises: z.array(z.number().int()),
  term: z.array(z.number().int()),
  rent_escalation: z.array(z.number().int()),
  options_notice: z.array(z.number().int()),
  expenses: z.array(z.number().int()),
  risk_clauses: z.array(z.number().int()),
});

/**
 * Routing pass: maps each field group to the page numbers relevant to it, so
 * the targeted pass below only sends each group the pages it needs instead
 * of the whole document.
 */
async function routePages(pages: CachedPage[]): Promise<Record<FieldGroup, number[]>> {
  const previews = pages
    .map((page) => `--- Page ${page.pageNumber} ---\n${page.text.slice(0, ROUTING_PREVIEW_CHARS)}`)
    .join("\n\n");

  const groupDescriptions = FIELD_GROUPS.map((group) => {
    const specs = fieldSpecsForGroup(group);
    return `- ${group}: ${specs.map((s) => s.label).join(", ")}`;
  }).join("\n");

  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: "medium", format: zodOutputFormat(RoutingSchema) },
    system:
      "You route pages of a commercial office lease PDF to the field groups they're " +
      "relevant to. A page can belong to more than one group. Only include a page " +
      "number if that page actually discusses fields in that group — don't guess.",
    messages: [
      {
        role: "user",
        content: `Field groups:\n${groupDescriptions}\n\nPage previews (truncated):\n\n${previews}`,
      },
    ],
  });

  return RoutingSchema.parse(response.parsed_output);
}

function fieldResultSchemaFor(fieldKeys: string[]) {
  const FieldResult = z.object({
    found: z.boolean(),
    value: z.string(),
    evidenceText: z.string(),
    pageNumber: z.number().int(),
    confidence: z.number().min(0).max(1),
  });
  return z.object(Object.fromEntries(fieldKeys.map((key) => [key, FieldResult])));
}

/** Targeted pass for one field group, run only against its routed pages. */
async function extractGroup(
  fieldGroup: FieldGroup,
  routedPageNumbers: number[],
  pages: CachedPage[],
): Promise<RawExtractedField[]> {
  if (routedPageNumbers.length === 0) return [];

  const specs = fieldSpecsForGroup(fieldGroup);
  const routedPages = pages.filter((p) => routedPageNumbers.includes(p.pageNumber));
  const pageText = routedPages
    .map((page) => `--- Page ${page.pageNumber} ---\n${page.text}`)
    .join("\n\n");
  const fieldList = specs.map((s) => `- ${s.fieldKey} ("${s.label}"): ${s.description}`).join("\n");

  const schema = fieldResultSchemaFor(specs.map((s) => s.fieldKey));
  const client = getAnthropicClient();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort: "high", format: zodOutputFormat(schema) },
    system:
      "You extract specific fields from a commercial office lease. For each field, " +
      "set found=false if it is not determinable from the provided pages — never " +
      "guess a value. When found=true, evidenceText must be an exact, verbatim " +
      "quote from the provided pages (not paraphrased) that supports value, and " +
      "pageNumber must be the page that quote appears on. confidence reflects how " +
      "clearly and unambiguously the pages support the extracted value.",
    messages: [
      {
        role: "user",
        content: `Fields to extract:\n${fieldList}\n\nLease pages:\n\n${pageText}`,
      },
    ],
  });

  const parsed = schema.parse(response.parsed_output);
  const routedPageSet = new Set(routedPageNumbers);
  const fields: RawExtractedField[] = [];
  for (const spec of specs) {
    const result = parsed[spec.fieldKey];
    if (!result.found) continue;
    if (!routedPageSet.has(result.pageNumber)) continue; // guard against a hallucinated page number
    fields.push({
      fieldGroup,
      fieldKey: spec.fieldKey,
      label: spec.label,
      value: result.value,
      evidenceText: result.evidenceText,
      pageNumber: result.pageNumber,
      confidence: result.confidence,
    });
  }
  return fields;
}

/**
 * Stage 2/6. Two-pass Claude extraction: a routing pass maps pages to field
 * groups, a targeted pass extracts each group against only its relevant
 * pages. Every Claude response is parsed and validated (zod) before being
 * treated as structured data (code-standards.md) — a malformed response
 * fails loudly rather than silently producing a bad extraction.
 */
export async function extract(input: ExtractInput): Promise<ExtractResult> {
  const pages = await loadCachedPages(input.documentId);
  const routing = await routePages(pages);

  const groupResults = await Promise.all(
    FIELD_GROUPS.map((group) => extractGroup(group, routing[group] ?? [], pages)),
  );

  updateDocumentStatus(input.documentId, "extracted");

  return {
    documentId: input.documentId,
    runId: input.runId,
    promptVersion: input.promptVersion,
    fields: groupResults.flat(),
  };
}
