import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { riskFlags } from "@/lib/db/schema";
import type { RiskFlag } from "@/lib/types";

type RiskFlagRow = typeof riskFlags.$inferSelect;

function toDomain(row: RiskFlagRow): RiskFlag {
  return {
    id: row.id,
    documentId: row.documentId,
    runId: row.runId,
    flagType: row.flagType,
    label: row.label,
    present: row.present,
    status: row.status,
    evidenceText: row.evidenceText,
    pageNumber: row.pageNumber,
    sourceFieldKey: row.sourceFieldKey,
    createdAt: row.createdAt,
  };
}

export type NewRiskFlag = Omit<RiskFlag, "id" | "createdAt">;

export function insertRiskFlags(flags: NewRiskFlag[]): RiskFlag[] {
  if (flags.length === 0) return [];
  const rows = flags.map((flag) => ({
    id: randomUUID(),
    documentId: flag.documentId,
    runId: flag.runId,
    flagType: flag.flagType,
    label: flag.label,
    present: flag.present,
    status: flag.status,
    evidenceText: flag.evidenceText,
    pageNumber: flag.pageNumber,
    sourceFieldKey: flag.sourceFieldKey,
  }));
  return db.insert(riskFlags).values(rows).returning().all().map(toDomain);
}

export function listLatestRiskFlags(documentId: string): RiskFlag[] {
  const rows = db
    .select()
    .from(riskFlags)
    .where(eq(riskFlags.documentId, documentId))
    .orderBy(desc(riskFlags.createdAt))
    .all();
  if (rows.length === 0) return [];
  const latestRunId = rows[0].runId;
  return rows.filter((row) => row.runId === latestRunId).map(toDomain);
}

export function listRiskFlagsForRun(documentId: string, runId: string): RiskFlag[] {
  return db
    .select()
    .from(riskFlags)
    .where(and(eq(riskFlags.documentId, documentId), eq(riskFlags.runId, runId)))
    .all()
    .map(toDomain);
}
