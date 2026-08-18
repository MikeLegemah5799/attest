import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { extractions } from "@/lib/db/schema";
import type { ExtractionField } from "@/lib/types";

type ExtractionRow = typeof extractions.$inferSelect;

function toDomain(row: ExtractionRow): ExtractionField {
  return {
    id: row.id,
    documentId: row.documentId,
    runId: row.runId,
    promptVersion: row.promptVersion,
    fieldGroup: row.fieldGroup,
    fieldKey: row.fieldKey,
    label: row.label,
    value: row.value,
    evidenceText: row.evidenceText,
    pageNumber: row.pageNumber,
    boundingBox: row.boundingBox ? JSON.parse(row.boundingBox) : null,
    confidence: row.confidence,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export type NewExtraction = Omit<ExtractionField, "id" | "createdAt"> & {
  groundingStatus: "grounded" | "ungrounded";
  verifierStatus: "confirmed" | "rejected" | null;
};

/** Writes new extraction rows. Never updates in place — invariant 4. */
export function insertExtractions(fields: NewExtraction[]): ExtractionField[] {
  if (fields.length === 0) return [];
  const rows = fields.map((field) => ({
    id: randomUUID(),
    documentId: field.documentId,
    runId: field.runId,
    promptVersion: field.promptVersion,
    fieldGroup: field.fieldGroup,
    fieldKey: field.fieldKey,
    label: field.label,
    value: field.value,
    evidenceText: field.evidenceText,
    pageNumber: field.pageNumber,
    boundingBox: field.boundingBox ? JSON.stringify(field.boundingBox) : null,
    confidence: field.confidence,
    groundingStatus: field.groundingStatus,
    verifierStatus: field.verifierStatus,
    status: field.status,
  }));
  return db.insert(extractions).values(rows).returning().all().map(toDomain);
}

export function listExtractionsForRun(documentId: string, runId: string): ExtractionField[] {
  return db
    .select()
    .from(extractions)
    .where(and(eq(extractions.documentId, documentId), eq(extractions.runId, runId)))
    .all()
    .map(toDomain);
}

/** Most recent run's extraction rows for a document, latest first. */
export function listLatestExtractions(documentId: string): ExtractionField[] {
  const rows = db
    .select()
    .from(extractions)
    .where(eq(extractions.documentId, documentId))
    .orderBy(desc(extractions.createdAt))
    .all();
  if (rows.length === 0) return [];
  const latestRunId = rows[0].runId;
  return rows.filter((row) => row.runId === latestRunId).map(toDomain);
}
