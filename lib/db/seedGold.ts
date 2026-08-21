import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { getDocumentBySlug } from "./queries/documents";
import { insertGoldLabels, listGoldLabelsForDocument, type NewGoldLabel } from "./queries/goldLabels";

type GoldFile = {
  slug: string;
  labels: { fieldKey: string; expectedValue: string; notes: string | null }[];
};

const GOLD_DIR = path.join(process.cwd(), "fixtures", "gold");

/**
 * Reads every fixtures/gold/*.json file (the protected, hand-labeled gold
 * set — ai-workflow-rules.md) and inserts any labels not already in
 * gold_labels. gold_labels is a queryable mirror of these files, never the
 * source of truth (lib/db/queries/goldLabels.ts) — labeling decisions are
 * made by editing the fixture files, this script only syncs them into SQLite.
 */
export async function seedGoldLabels(): Promise<{ created: number; skipped: number }> {
  const entries = await readdir(GOLD_DIR);
  const files = entries.filter((entry) => entry.endsWith(".json"));

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const raw = await readFile(path.join(GOLD_DIR, file), "utf-8");
    const parsed = JSON.parse(raw) as GoldFile;
    const doc = getDocumentBySlug(parsed.slug);
    if (!doc) {
      throw new Error(
        `${file} references unknown document slug "${parsed.slug}" — run \`npm run db:seed\` first`,
      );
    }

    const existingFieldKeys = new Set(listGoldLabelsForDocument(doc.id).map((label) => label.fieldKey));
    const toInsert: NewGoldLabel[] = parsed.labels
      .filter((label) => !existingFieldKeys.has(label.fieldKey))
      .map((label) => ({
        documentId: doc.id,
        fieldKey: label.fieldKey,
        expectedValue: label.expectedValue,
        notes: label.notes ?? null,
      }));

    insertGoldLabels(toInsert);
    created += toInsert.length;
    skipped += parsed.labels.length - toInsert.length;
  }

  return { created, skipped };
}

async function main() {
  const result = await seedGoldLabels();
  console.log(`Seeded ${result.created} gold label(s), skipped ${result.skipped} already present.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
