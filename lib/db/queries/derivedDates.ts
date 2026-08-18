import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { derivedDates } from "@/lib/db/schema";
import type { DerivedDate } from "@/lib/types";

type DerivedDateRow = typeof derivedDates.$inferSelect;

function toDomain(row: DerivedDateRow): DerivedDate {
  return {
    id: row.id,
    documentId: row.documentId,
    runId: row.runId,
    dateType: row.dateType,
    label: row.label,
    value: row.value,
    status: row.status,
    reason: row.reason,
    sourceFieldKeys: JSON.parse(row.sourceFieldKeys),
    createdAt: row.createdAt,
  };
}

export type NewDerivedDate = Omit<DerivedDate, "id" | "createdAt">;

export function insertDerivedDates(dates: NewDerivedDate[]): DerivedDate[] {
  if (dates.length === 0) return [];
  const rows = dates.map((date) => ({
    id: randomUUID(),
    documentId: date.documentId,
    runId: date.runId,
    dateType: date.dateType,
    label: date.label,
    value: date.value,
    status: date.status,
    reason: date.reason,
    sourceFieldKeys: JSON.stringify(date.sourceFieldKeys),
  }));
  return db.insert(derivedDates).values(rows).returning().all().map(toDomain);
}

export function listLatestDerivedDates(documentId: string): DerivedDate[] {
  const rows = db
    .select()
    .from(derivedDates)
    .where(eq(derivedDates.documentId, documentId))
    .orderBy(desc(derivedDates.createdAt))
    .all();
  if (rows.length === 0) return [];
  const latestRunId = rows[0].runId;
  return rows.filter((row) => row.runId === latestRunId).map(toDomain);
}

export function listDerivedDatesForRun(documentId: string, runId: string): DerivedDate[] {
  return db
    .select()
    .from(derivedDates)
    .where(and(eq(derivedDates.documentId, documentId), eq(derivedDates.runId, runId)))
    .all()
    .map(toDomain);
}
