import path from "node:path";

import { getDocumentBySlug } from "@/lib/db/queries/documents";

import { derive } from "./derive";
import { extract } from "./extract";
import { ingest } from "./ingest";
import { persist } from "./persist";
import { verify } from "./verify";

const FIXTURE_DIR = "fixtures/leases";
const PROMPT_VERSION = "dev";

export type RunDocumentResult = {
  slug: string;
  documentId: string;
  runId: string;
  fieldsExtracted: number;
  fieldsGrounded: number;
};

/**
 * Runs the full write chain (ingest -> extract -> verify -> persist ->
 * derive) against one seeded document, by slug. Thin sequencing only — every
 * stage already owns its real behavior; this just wires them together the
 * same way each stage's own live end-to-end check has, so processing the
 * rest of the seeded set doesn't mean re-deriving that sequence by hand
 * each time (surfacePrep is read-only view-shaping, not part of the write
 * chain, so it's not called here).
 */
export async function runDocument(slug: string): Promise<RunDocumentResult> {
  const doc = getDocumentBySlug(slug);
  if (!doc) throw new Error(`No document with slug "${slug}"`);

  const filePath = path.join(FIXTURE_DIR, doc.filename);
  const runId = crypto.randomUUID();

  // Ingest writes pages rows keyed unique on (documentId, pageNumber) — not
  // safe to re-run once a prior attempt already ingested this document (e.g.
  // a retry after a later stage failed), so skip it past "pending".
  if (doc.status === "pending") {
    await ingest({ documentId: doc.id, filePath });
  }
  const extracted = await extract({ documentId: doc.id, runId, promptVersion: PROMPT_VERSION });
  const verified = await verify({ documentId: doc.id, filePath, fields: extracted.fields });
  await persist({ documentId: doc.id, runId, promptVersion: PROMPT_VERSION, fields: verified });
  await derive({ documentId: doc.id, runId });

  return {
    slug,
    documentId: doc.id,
    runId,
    fieldsExtracted: extracted.fields.length,
    fieldsGrounded: verified.filter((f) => f.groundingStatus === "grounded").length,
  };
}

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error("Usage: tsx lib/pipeline/runDocument.ts <slug> [slug...]");
    process.exitCode = 1;
    return;
  }

  for (const slug of slugs) {
    const result = await runDocument(slug);
    console.log(JSON.stringify(result, null, 2));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
