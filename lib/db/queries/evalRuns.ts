import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { evalRuns } from "@/lib/db/schema";
import type { EvalRun } from "@/lib/types";

type EvalRunRow = typeof evalRuns.$inferSelect;

function toDomain(row: EvalRunRow): EvalRun {
  return {
    id: row.id,
    runId: row.runId,
    promptVersion: row.promptVersion,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    fieldAccuracy: row.fieldAccuracy ? JSON.parse(row.fieldAccuracy) : null,
    dateAccuracy: row.dateAccuracy ? JSON.parse(row.dateAccuracy) : null,
  };
}

export function startEvalRun(runId: string, promptVersion: string): EvalRun {
  const row = db
    .insert(evalRuns)
    .values({ id: randomUUID(), runId, promptVersion, startedAt: new Date() })
    .returning()
    .get();
  return toDomain(row);
}

export function finishEvalRun(
  id: string,
  scorecards: { fieldAccuracy: EvalRun["fieldAccuracy"]; dateAccuracy: EvalRun["dateAccuracy"] },
): EvalRun {
  const row = db
    .update(evalRuns)
    .set({
      finishedAt: new Date(),
      fieldAccuracy: JSON.stringify(scorecards.fieldAccuracy),
      dateAccuracy: JSON.stringify(scorecards.dateAccuracy),
    })
    .where(eq(evalRuns.id, id))
    .returning()
    .get();
  return toDomain(row);
}

export function listEvalRuns(): EvalRun[] {
  return db.select().from(evalRuns).orderBy(desc(evalRuns.startedAt)).all().map(toDomain);
}
