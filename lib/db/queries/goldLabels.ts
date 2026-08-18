import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { goldLabels } from "@/lib/db/schema";

export type GoldLabel = typeof goldLabels.$inferSelect;
export type NewGoldLabel = Omit<typeof goldLabels.$inferInsert, "id">;

/**
 * Seeds gold_labels from the protected fixtures/gold/* source files. This
 * table is a queryable mirror, never the source of truth — labeling
 * decisions are made by editing the fixture files, not this table.
 */
export function insertGoldLabels(labels: NewGoldLabel[]): GoldLabel[] {
  if (labels.length === 0) return [];
  const rows = labels.map((label) => ({ id: randomUUID(), ...label }));
  return db.insert(goldLabels).values(rows).returning().all();
}

export function listGoldLabelsForDocument(documentId: string): GoldLabel[] {
  return db.select().from(goldLabels).where(eq(goldLabels.documentId, documentId)).all();
}
